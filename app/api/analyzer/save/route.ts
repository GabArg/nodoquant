import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import {
    getUserSubscription,
    isProUser,
    canCreateStrategy,
    FREE_PLAN_LIMITS,
} from "@/lib/payments/subscription";
import { sendStrategyReadyEmail } from "@/lib/email/sendStrategyReadyEmail";
import { getBaseUrl } from "@/lib/url";

/**
 * PRODUCTION-GRADE Save Analysis System
 *
 * Features:
 * - Idempotency: Uses DB-driven state (email_send_status)
 * - Race-Safe: Atomic claim before sending via conditional update
 * - Resilience: Tracks attempts and persists errors for safe retries
 * - Validation: Uses the authenticated session as the trusted email source
 */

export interface SaveAnalysisBody {
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json: object;
    user_email?: string;
    file_name?: string;
    date_range_start?: string;
    date_range_end?: string;
    sum_profit?: number;
    project_id?: string;
    strategy_id?: string;
    dataset_name?: string;
    user_id?: string;
    isTest?: boolean;
    isAnonymous?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body: SaveAnalysisBody = await req.json();

        const {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json,
            file_name,
            date_range_start,
            date_range_end,
            sum_profit,
            project_id,
            strategy_id,
            dataset_name,
        } = body;

        // 1. Basic validation
        if (
            typeof trades_count !== "number" ||
            typeof winrate !== "number" ||
            typeof profit_factor !== "number" ||
            typeof max_drawdown !== "number"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Métricas requeridas incompletas",
                },
                {
                    status: 400,
                }
            );
        }

        // 2. Auth & ownership
        const authClient = createClient();
        const {
            data: { session },
        } = await authClient.auth.getSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Unauthorized: Debe iniciar sesión para guardar métricas",
                },
                {
                    status: 401,
                }
            );
        }

        const user_id = session.user.id;
        const sessionEmail = session.user.email ?? null;

        const sub = await getUserSubscription(user_id);
        const isPro = isProUser(sub);

        // 3. Plan limit enforcement
        if (
            !isPro &&
            trades_count > FREE_PLAN_LIMITS.MAX_TRADES_PER_ANALYSIS
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Límite del plan superado",
                    reason: `El plan gratuito permite hasta ${FREE_PLAN_LIMITS.MAX_TRADES_PER_ANALYSIS} transacciones por análisis. Actualizá a Pro para analizar sin límites.`,
                },
                {
                    status: 403,
                }
            );
        }

        const canSave = await canCreateStrategy(user_id, isPro);

        if (!canSave) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Límite del plan superado",
                    reason: `El plan gratuito permite hasta ${FREE_PLAN_LIMITS.MAX_SAVED_STRATEGIES} análisis guardado. Actualizá a Pro para guardar análisis ilimitados.`,
                },
                {
                    status: 403,
                }
            );
        }

        const record = {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json: metrics_json ?? {},
            user_email: sessionEmail,
            file_name: file_name ?? null,
            date_range_start: date_range_start ?? null,
            date_range_end: date_range_end ?? null,
            sum_profit: sum_profit ?? null,
            user_id,
            project_id: project_id ?? null,
            strategy_id: strategy_id ?? null,
            dataset_name: dataset_name ?? "Dataset",
            email_send_status: "pending",
            email_send_attempts: 0,
        };

        const supabase = getSupabaseServer();

        if (!supabase) {
            return handleLocalFallback(record);
        }

        // 4. Record handling: deduplicate or create
        const { data: existingAnalysis } = await supabase
            .from("trade_analysis")
            .select("id, email_send_status, email_send_attempts")
            .eq("user_id", user_id)
            .eq("trades_count", trades_count)
            .eq("winrate", winrate)
            .eq("profit_factor", profit_factor)
            .eq("max_drawdown", max_drawdown)
            .limit(1)
            .single();

        let reportId = existingAnalysis?.id;
        const isNewInsert = !existingAnalysis;

        if (isNewInsert) {
            const { data, error } = await supabase
                .from("trade_analysis")
                .insert(record)
                .select("id")
                .single();

            if (error) {
                console.error(
                    "[Analyzer] Supabase insert error:",
                    error.message
                );

                return NextResponse.json(
                    {
                        ok: false,
                        error: "Error al guardar análisis",
                    },
                    {
                        status: 500,
                    }
                );
            }

            reportId = data?.id;
        }

        console.log("[Analyzer] Analysis record processed", {
            id: reportId,
            isNewInsert,
        });

        // 5. Email trigger system
        if (reportId) {
            const enableEmails = process.env.ENABLE_EMAILS === "true";
            const effectiveEmail = sessionEmail;

            const isValidEmail = effectiveEmail
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)
                : false;

            const skipReason = !enableEmails
                ? "env_disabled"
                : !!body.isAnonymous
                ? "anonymous_user"
                : !effectiveEmail
                ? "missing_email"
                : !isValidEmail
                ? "invalid_email"
                : null;

            if (skipReason) {
                console.log("[Email Workflow] Skipped", {
                    report_id: reportId,
                    reason: skipReason,
                    email: effectiveEmail,
                });
            } else {
                const nextAttempt =
                    (existingAnalysis?.email_send_attempts || 0) + 1;

                // Conditional claim: only pending or failed reports can send
                const { data: claimed, error: claimError } = await supabase
                    .from("trade_analysis")
                    .update({
                        email_send_status: "sending",
                        email_send_attempts: nextAttempt,
                    })
                    .eq("id", reportId)
                    .in("email_send_status", ["pending", "failed"])
                    .select("id")
                    .single();

                if (claimError || !claimed) {
                    console.log(
                        "[Email Workflow] Claim skipped (already claimed/sent)",
                        {
                            report_id: reportId,
                        }
                    );
                } else {
                    console.log(
                        "[Email Workflow] Claimed successfully, starting send",
                        {
                            report_id: reportId,
                            user: effectiveEmail,
                        }
                    );

                    const userName =
                        session.user.user_metadata?.full_name ||
                        session.user.user_metadata?.name ||
                        "Trader";

                    const reportUrl = `${getBaseUrl()}/report/${reportId}`;

                    try {
                        await sendStrategyReadyEmail({
                            to: effectiveEmail!,
                            name: userName,
                            reportUrl,
                        });

                        console.log("[Email Workflow] SUCCESS", {
                            report_id: reportId,
                        });

                        const { error: sentUpdateError } = await supabase
                            .from("trade_analysis")
                            .update({
                                email_send_status: "sent",
                                email_sent_at: new Date().toISOString(),
                                email_last_error: null,
                            })
                            .eq("id", reportId);

                        if (sentUpdateError) {
                            console.error(
                                "[Email Workflow] Failed to persist sent state",
                                {
                                    report_id: reportId,
                                    error: sentUpdateError.message,
                                }
                            );
                        }
                    } catch (err) {
                        const message =
                            err instanceof Error
                                ? err.message
                                : String(err);

                        console.error(
                            "[Email Workflow] CRITICAL FAILURE",
                            {
                                report_id: reportId,
                                error: message,
                            }
                        );

                        const { error: failedUpdateError } = await supabase
                            .from("trade_analysis")
                            .update({
                                email_send_status: "failed",
                                email_last_error: message,
                            })
                            .eq("id", reportId);

                        if (failedUpdateError) {
                            console.error(
                                "[Email Workflow] Failed to persist failed state",
                                {
                                    report_id: reportId,
                                    error: failedUpdateError.message,
                                }
                            );
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            ok: true,
            id: reportId,
            duplicated: !isNewInsert,
        });
    } catch (err) {
        console.error("[Analyzer] Save route error:", err);

        return NextResponse.json(
            {
                ok: false,
                error: "Error interno del servidor",
            },
            {
                status: 500,
            }
        );
    }
}

async function handleLocalFallback(record: Record<string, unknown>) {
    console.warn(
        "[Analyzer] Supabase not configured — saving to analysis-dev.json"
    );

    const filePath = path.join(process.cwd(), "analysis-dev.json");

    let existing: Record<string, unknown>[] = [];

    try {
        const raw = await readFile(filePath, "utf-8");
        existing = JSON.parse(raw);
    } catch {
        // File may not exist yet in local development.
    }

    const id = crypto.randomUUID();

    existing.push({
        id,
        created_at: new Date().toISOString(),
        ...record,
    });

    await writeFile(
        filePath,
        JSON.stringify(existing, null, 2),
        "utf-8"
    );

    return NextResponse.json({
        ok: true,
        id,
    });
}
