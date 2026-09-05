import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
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
 * - Idempotency: Uses a deterministic analysis fingerprint
 * - Race-Safe: Unique DB index prevents duplicate analysis inserts
 * - Email Race-Safe: Atomic claim before sending via conditional update
 * - Resilience: Tracks email attempts and persists errors for safe retries
 * - Validation: Uses the authenticated session as the trusted email source
 */

export interface SaveAnalysisBody {
    trades_count: number;
    winrate: number;
    profit_factor: number;
    max_drawdown: number;
    metrics_json: object;
    file_name?: string;
    date_range_start?: string;
    date_range_end?: string;
    sum_profit?: number;
    project_id?: string;
    strategy_id?: string;
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

        // 3. Per-analysis plan limit enforcement
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

        const safeFileName =
            typeof file_name === "string" && file_name.trim().length > 0
                ? file_name.trim().slice(0, 100)
                : null;

        const normalizedMetrics =
            metrics_json &&
            typeof metrics_json === "object" &&
            !Array.isArray(metrics_json)
                ? metrics_json
                : {};

        const fingerprintPayload = {
            user_id,
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            sum_profit: sum_profit ?? null,
            date_range_start: date_range_start ?? null,
            date_range_end: date_range_end ?? null,
            metrics_json: normalizedMetrics,
        };

        const analysisFingerprint = createHash("sha256")
            .update(stableStringify(fingerprintPayload))
            .digest("hex");

        const record = {
            trades_count,
            winrate,
            profit_factor,
            max_drawdown,
            metrics_json: normalizedMetrics,
            user_email: sessionEmail,
            file_name: safeFileName,
            date_range_start: date_range_start ?? null,
            date_range_end: date_range_end ?? null,
            sum_profit: sum_profit ?? null,
            user_id,
            project_id: project_id ?? null,
            strategy_id: strategy_id ?? null,
            dataset_name: safeFileName ?? "Dataset",
            analysis_fingerprint: analysisFingerprint,
            email_send_status: "pending",
            email_send_attempts: 0,
            email_send_started_at: null,
        };

        const supabase = getSupabaseServer();

        if (!supabase) {
            return handleLocalFallback(record);
        }

        // 4. Record handling: fingerprint-based deduplication
        const { data: existingAnalysis, error: existingError } =
            await supabase
                .from("trade_analysis")
                .select("id, email_send_status, email_send_attempts, email_send_started_at")
                .eq("user_id", user_id)
                .eq("analysis_fingerprint", analysisFingerprint)
                .maybeSingle();

        if (existingError) {
            console.error(
                "[Analyzer] Supabase dedup lookup error:",
                existingError.message
            );

            return NextResponse.json(
                {
                    ok: false,
                    error: "Error al verificar análisis existente",
                },
                {
                    status: 500,
                }
            );
        }

        let reportId = existingAnalysis?.id;
        let isNewInsert = !existingAnalysis;
        let analysisForEmail = existingAnalysis;

        if (isNewInsert) {
            // Only a genuinely new analysis consumes a saved-strategy slot.
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

            const { data, error } = await supabase
                .from("trade_analysis")
                .insert(record)
                .select("id, email_send_status, email_send_attempts, email_send_started_at")
                .single();

            if (error) {
                // A simultaneous request may have inserted the same fingerprint
                // after our lookup but before this insert. The unique index is
                // the final source of truth for idempotency.
                if (error.code === "23505") {
                    const {
                        data: concurrentExisting,
                        error: concurrentLookupError,
                    } = await supabase
                        .from("trade_analysis")
                        .select(
                            "id, email_send_status, email_send_attempts, email_send_started_at"
                        )
                        .eq("user_id", user_id)
                        .eq(
                            "analysis_fingerprint",
                            analysisFingerprint
                        )
                        .maybeSingle();

                    if (
                        concurrentLookupError ||
                        !concurrentExisting
                    ) {
                        console.error(
                            "[Analyzer] Duplicate detected but existing analysis could not be recovered",
                            concurrentLookupError?.message
                        );

                        return NextResponse.json(
                            {
                                ok: false,
                                error: "Error al recuperar análisis existente",
                            },
                            {
                                status: 500,
                            }
                        );
                    }

                    reportId = concurrentExisting.id;
                    analysisForEmail = concurrentExisting;
                    isNewInsert = false;
                } else {
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
            } else {
                reportId = data?.id;
                analysisForEmail = data;
            }
        }

        // 5. Reconcile stale "sending" state without risking duplicate emails
        if (
            reportId &&
            analysisForEmail?.email_send_status === "sending" &&
            analysisForEmail.email_send_started_at
        ) {
            const sendStartedAt = new Date(
                analysisForEmail.email_send_started_at
            ).getTime();

            const isStaleSending =
                Number.isFinite(sendStartedAt) &&
                Date.now() - sendStartedAt > 15 * 60 * 1000;

            if (isStaleSending) {
                const staleSendStartedAt =
                    analysisForEmail.email_send_started_at;

                const {
                    data: reconciled,
                    error: reconcileError,
                } = await supabase
                    .from("trade_analysis")
                    .update({
                        email_send_status: "sent_unconfirmed",
                        email_last_error:
                            "Email send outcome could not be confirmed after a stale sending state. Automatic resend suppressed to avoid duplicates.",
                    })
                    .eq("id", reportId)
                    .eq("email_send_status", "sending")
                    .eq("email_send_started_at", staleSendStartedAt)
                    .select("id, email_send_status")
                    .maybeSingle();

                if (reconcileError) {
                    console.error(
                        "[Email Workflow] Failed to reconcile stale sending state",
                        {
                            report_id: reportId,
                            error: reconcileError.message,
                        }
                    );
                } else if (reconciled) {
                    console.warn(
                        "[Email Workflow] Stale sending state marked as sent_unconfirmed",
                        {
                            report_id: reportId,
                        }
                    );

                    analysisForEmail = {
                        ...analysisForEmail,
                        email_send_status: "sent_unconfirmed",
                    };
                }
            }
        }

        // 6. Email trigger system
        if (reportId) {
            const enableEmails = process.env.ENABLE_EMAILS === "true";
            const effectiveEmail = sessionEmail;

            const isValidEmail = effectiveEmail
                ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)
                : false;

            const skipReason = !enableEmails
                ? "env_disabled"
                : !effectiveEmail
                ? "missing_email"
                : !isValidEmail
                ? "invalid_email"
                : null;

            if (!skipReason) {
                const nextAttempt =
                    (analysisForEmail?.email_send_attempts || 0) + 1;

                // Conditional claim: only pending or failed reports can send
                const { data: claimed, error: claimError } = await supabase
                    .from("trade_analysis")
                    .update({
                        email_send_status: "sending",
                        email_send_attempts: nextAttempt,
                        email_send_started_at: new Date().toISOString(),
                        email_last_error: null,
                    })
                    .eq("id", reportId)
                    .in("email_send_status", ["pending", "failed"])
                    .select("id")
                    .single();

                if (!claimError && claimed) {
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
                    } catch (err: unknown) {
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
    } catch (err: unknown) {
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

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value
            .map((item) => stableStringify(item))
            .join(",")}]`;
    }

    const objectValue = value as Record<string, unknown>;
    const sortedKeys = Object.keys(objectValue).sort();

    return `{${sortedKeys
        .map(
            (key) =>
                `${JSON.stringify(key)}:${stableStringify(
                    objectValue[key]
                )}`
        )
        .join(",")}}`;
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

    const fingerprint =
        typeof record.analysis_fingerprint === "string"
            ? record.analysis_fingerprint
            : null;

    const existingLocal = fingerprint
        ? existing.find(
              (item) =>
                  item.analysis_fingerprint === fingerprint &&
                  item.user_id === record.user_id
          )
        : undefined;

    if (existingLocal?.id) {
        return NextResponse.json({
            ok: true,
            id: existingLocal.id,
            duplicated: true,
        });
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
        duplicated: false,
    });
}
