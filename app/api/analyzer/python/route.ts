import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";

const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { trades, metadata } = body;

        if (!trades || !Array.isArray(trades) || trades.length < 2) {
            return NextResponse.json(
                { ok: false, error: "Datos de trades inválidos o insuficientes." },
                { status: 400 }
            );
        }

        // 1. Send data to Python Analytics Engine
        const pyResponse = await fetch(`${PYTHON_ENGINE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trades })
        });

        if (!pyResponse.ok) {
            const errorData = await pyResponse.text();
            console.error("[Python API Error]", errorData);
            return NextResponse.json(
                { ok: false, error: "Error en el motor de análisis cuantitativo." },
                { status: pyResponse.status }
            );
        }

        const metrics = await pyResponse.json();

        // 2. Save results to Supabase Strategy Reports (Phase 1 Data Model)
        // Check active session
        const authClient = createClient();
        const { data: { session } } = await authClient.auth.getSession();
        const user_id = session?.user?.id ?? null;

        const supabase = getSupabaseServer();
        let reportId = null;

        if (supabase) {
            // We assume a trade_import record was created beforehand or we create a dummy one here
            // For simplicity in Phase 1 MVP without full upload flow, we can insert just the report

            const { data: reportData, error: reportError } = await supabase
                .from("strategy_reports")
                .insert({
                    user_id,
                    strategy_score: metrics.strategy_score,
                    expectancy_r: metrics.expectancy_r,
                    win_rate: metrics.win_rate,
                    profit_factor: metrics.profit_factor,
                    max_drawdown: metrics.max_drawdown_r,
                    total_trades: metrics.total_trades,
                    average_r: metrics.average_r
                })
                .select("report_id")
                .single();

            if (reportError) {
                console.error("[Supabase Error] inserting strategy report:", reportError.message);
            } else {
                reportId = reportData.report_id;
            }
        }

        return NextResponse.json({
            ok: true,
            report_id: reportId,
            metrics
        });

    } catch (err) {
        console.error("[Analyzer Route Error]", err);
        return NextResponse.json(
            { ok: false, error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
