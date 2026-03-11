import { ImageResponse } from 'next/og';
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return new Response('Missing ID', { status: 400 });

        const supabase = getSupabaseServer();
        if (!supabase) return new Response('DB Error', { status: 500 });

        const { data: report, error } = await supabase
            .from("trade_analysis")
            .select(`
                id,
                public_id,
                dataset_name,
                file_name,
                trades_count,
                winrate,
                profit_factor,
                metrics_json,
                strategies ( name )
            `)
            .or(`id.eq.${id},public_id.eq.${id}`)
            .single();

        if (error || !report) return new Response('Not Found', { status: 404 });

        const metrics = report.metrics_json as any ?? {};
        const score = Math.round(metrics?.strategy_score ?? metrics?.quant_score ?? 0);
        const wr = (report.winrate ?? metrics?.win_rate ?? metrics?.winrate ?? 0) * (report.winrate <= 1 ? 100 : 1);
        const pf = report.profit_factor ?? metrics?.profit_factor ?? 0;
        const trades = report.trades_count ?? metrics?.total_trades ?? 0;
        const strategyName = (report.strategies as any)?.name ?? report.dataset_name ?? report.file_name ?? "Report";

        let tierColor = "#34d399"; // emerald-400
        let tierLabel = "Elite";
        if (score < 60) {
            tierColor = "#f87171"; // red-400
            tierLabel = "Weak Edge";
        } else if (score < 75) {
            tierColor = "#fbbf24"; // amber-400
            tierLabel = "Moderate Edge";
        } else if (score < 90) {
            tierColor = "#60a5fa"; // blue-400
            tierLabel = "Strong Edge";
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#07090F',
                        padding: '60px',
                        color: 'white',
                        fontFamily: 'sans-serif',
                        border: '10px solid #10141D',
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(3deg)' }}>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '24px' }}>N</span>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', marginLeft: '12px' }}>NodoQuant</span>
                        </div>
                        <div style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 16px' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '2px' }}>Strategy Score Certified</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <h1 style={{ fontSize: '48px', fontWeight: '900', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase' }}>
                            {strategyName}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: tierColor, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                {tierLabel}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '80px' }}>
                            <div style={{ position: 'relative', width: '220px', height: '220px', borderRadius: '110px', border: '8px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '72px', fontWeight: '900', lineHeight: 1 }}>{score}</span>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</span>
                            </div>

                            <div style={{ display: 'flex', gap: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Win Rate</span>
                                    <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{wr.toFixed(1)}%</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Profit Factor</span>
                                    <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{pf.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Trades</span>
                                    <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{trades}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                        <span style={{ fontSize: '10px', color: '#4b5563', maxWidth: '400px' }}>
                            Verified statistical analysis for professional traders by the NodoQuant Quantitative Analysis Engine.
                        </span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                headers: {
                    'Cache-Control': 'public, max-age=86400',
                },
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
