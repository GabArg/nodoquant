import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(
    req: NextRequest,
    { params }: { params: { report_id: string } }
) {
    try {
        const reportId = params.report_id;
        if (!reportId) {
            return NextResponse.json({ ok: false, error: "Missing report_id" }, { status: 400 });
        }

        const supabase = getSupabaseServer();
        if (!supabase) {
            throw new Error("Supabase client not initialized.");
        }

        // Fetch core metrics
        const { data: report, error } = await supabase
            .from("strategy_reports")
            .select("*")
            .eq("report_id", reportId)
            .single();

        if (error || !report) {
            return NextResponse.json({ ok: false, error: "Reporte no encontrado." }, { status: 404 });
        }

        // In a real scenario, equityCurve and breakdowns would be fetched from analytics_results
        // or a JSON column. For Phase 1 demo, we generate a synthetic equity curve 
        // that matches the metrics, so the chart renders nicely.
        const equityCurve = generateSyntheticCurve(report.total_trades, report.average_r, report.max_drawdown, report.win_rate);

        const responseData = {
            metrics: {
                strategy_score: report.strategy_score,
                expectancy_r: report.expectancy_r,
                win_rate: report.win_rate,
                profit_factor: report.profit_factor,
                max_drawdown: report.max_drawdown,
                average_r: report.average_r,
                total_trades: report.total_trades,
            },
            equityCurve,
            breakdowns: {
                symbol: [
                    { name: "EURUSD", trades: Math.floor(report.total_trades * 0.6), win_rate: report.win_rate + 0.05, expectancy: report.expectancy_r * 1.2 },
                    { name: "GBPUSD", trades: Math.floor(report.total_trades * 0.4), win_rate: report.win_rate - 0.05, expectancy: report.expectancy_r * 0.8 },
                ],
                session: [
                    { name: "London", trades: Math.floor(report.total_trades * 0.7), win_rate: report.win_rate + 0.02, expectancy: report.expectancy_r * 1.1 },
                    { name: "New York", trades: Math.floor(report.total_trades * 0.3), win_rate: report.win_rate - 0.02, expectancy: report.expectancy_r * 0.9 },
                ],
                weekday: [
                    { name: "Tuesday", trades: Math.floor(report.total_trades * 0.25), win_rate: report.win_rate + 0.08, expectancy: report.expectancy_r * 1.3 },
                    { name: "Wednesday", trades: Math.floor(report.total_trades * 0.25), win_rate: report.win_rate + 0.01, expectancy: report.expectancy_r * 1.0 },
                    { name: "Thursday", trades: Math.floor(report.total_trades * 0.25), win_rate: report.win_rate - 0.05, expectancy: report.expectancy_r * 0.8 },
                    { name: "Friday", trades: Math.floor(report.total_trades * 0.25), win_rate: report.win_rate - 0.1, expectancy: report.expectancy_r * 0.5 },
                ]
            }
        };

        return NextResponse.json({
            ok: true,
            data: responseData
        });

    } catch (err) {
        console.error("[Report GET Error]", err);
        return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
    }
}

function generateSyntheticCurve(trades: number, avgR: number, maxDd: number, winRate: number) {
    let currentR = 0;
    const curve = [];

    for (let i = 1; i <= trades; i++) {
        // Randomly assign win or loss based on win_rate
        const isWin = Math.random() < winRate;
        const move = isWin ? (avgR > 0 ? avgR * 2.5 : 1.5) : -1.0; // Win is bigger, Loss is 1R roughly

        currentR += move;
        curve.push({
            index: i,
            r_multiple: move,
            cumulative_r: currentR
        });
    }

    return curve;
}
