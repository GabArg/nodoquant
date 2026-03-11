import { ImageResponse } from 'next/og';
import { getSupabaseServer } from "@/lib/supabase";

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        if (!slug) return new Response('Missing slug', { status: 400 });

        const supabase = getSupabaseServer();
        if (!supabase) return new Response('DB Error', { status: 500 });

        const { data: strategy, error } = await supabase
            .from("public_strategy_profiles")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error || !strategy) return new Response('Not Found', { status: 404 });

        const score = Math.round(strategy.score || 0);
        const wr = strategy.win_rate * (strategy.win_rate <= 1 ? 100 : 1);
        const pf = strategy.profit_factor || 0;
        const trades = strategy.trades_count || 0;
        const name = strategy.strategy_name || "Strategy";
        const tier = strategy.tier || "Verified";
        const market = strategy.market || "Forex";
        const symbol = strategy.symbol || "";

        let tierColor = "#6366f1"; // indigo-500
        if (score >= 90) tierColor = "#10b981"; // emerald-500
        else if (score < 60) tierColor = "#f43f5e"; // rose-500

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
                    }}
                >
                    {/* Background Pattern */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', backgroundColor: 'rgba(99, 102, 241, 0.03)', borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: '900', marginLeft: '12px', letterSpacing: '-0.5px' }}>NodoQuant</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 14px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px' }}>{market}</span>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>{symbol}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '40px' }}>
                            <h1 style={{ fontSize: '64px', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1', letterSpacing: '-2px' }}>
                                {name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '6px', backgroundColor: '#10b981' }} />
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px' }}>Verified Quantitative Profile</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px', backgroundColor: '#0A0D14', border: '2px solid rgba(99, 102, 241, 0.1)', borderRadius: '40px', padding: '40px 20px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px' }}>Strategy Score</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                <span style={{ fontSize: '100px', fontWeight: '900', color: 'white', lineHeight: '1' }}>{score}</span>
                                <div style={{ width: '60px', height: '6px', backgroundColor: tierColor, borderRadius: '3px', marginTop: '10px', opacity: '0.6', filter: 'blur(4px)' }} />
                            </div>
                            <div style={{ marginTop: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <span style={{ fontSize: '12px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase' }}>{tier}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px' }}>
                        <div style={{ display: 'flex', gap: '60px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Win Rate</span>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{wr.toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Profit Factor</span>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: '#10b981' }}>{pf.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Sample Size</span>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>{trades}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#4b5563' }}>nodoquant.com</span>
                        </div>
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
