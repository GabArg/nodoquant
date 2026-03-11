import { getSupabaseServer } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

/**
 * Lightweight Admin Metrics Page
 * Displays high-level stats of the viral loop and user activity.
 */
export default async function AdminMetricsPage({ params }: { params: { locale: string } }) {
    const supabase = getSupabaseServer();
    if (!supabase) return <div>Database configuration error</div>;

    // Direct check for admin access (simple version for now)
    // In a real app, this would check a 'role' or 'is_admin' field in profiles.
    const { data: { user } } = await supabase.auth.getUser();

    // For now, let's allow access if the email is @nodoquant.com or if we are in dev mode
    const isAdmin = user?.email?.endsWith('@nodoquant.com') || process.env.NODE_ENV === 'development';

    // If not admin, return 404 to hide the page existence
    if (!isAdmin) {
        // notFound(); // Uncomment for production
    }

    // Fetch stats
    const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return <div>Error fetching metrics: {error.message}</div>;

    const stats = {
        total_runs: events.filter(e => e.event_name === 'analyzer_run').length,
        total_certificates: events.filter(e => e.event_name === 'certificate_view').length,
        total_shares: events.filter(e => e.event_name === 'certificate_share').length,
        total_publishes: events.filter(e => e.event_name === 'strategy_publish').length,
    };

    // Group shares by platform
    const shareByPlatform = events
        .filter(e => e.event_name === 'certificate_share')
        .reduce((acc: any, e) => {
            const p = e.properties?.platform || 'unknown';
            acc[p] = (acc[p] || 0) + 1;
            return acc;
        }, {});

    return (
        <div className="min-h-screen bg-[#07090F] text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Admin Metrics</h1>
                        <p className="text-gray-500 text-sm mt-1">Real-time performance of the viral loops.</p>
                    </div>
                    <Link
                        href={`/${params.locale}/dashboard`}
                        className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg transition-all"
                    >
                        Return to Dashboard
                    </Link>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <MetricCard title="Analyzer Runs" value={stats.total_runs} icon="📊" color="text-indigo-400" />
                    <MetricCard title="Certificates Viewed" value={stats.total_certificates} icon="📜" color="text-emerald-400" />
                    <MetricCard title="Social Shares" value={stats.total_shares} icon="🚀" color="text-amber-400" />
                    <MetricCard title="Strategies Published" value={stats.total_publishes} icon="🌎" color="text-indigo-400" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Share Breakdown */}
                    <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="text-amber-400">📈</span> Share Breakdown
                        </h2>
                        <div className="space-y-4">
                            {Object.entries(shareByPlatform).map(([platform, count]: any) => (
                                <div key={platform} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-sm font-bold uppercase tracking-wider text-gray-400">{platform}</span>
                                    <span className="text-xl font-black">{count}</span>
                                </div>
                            ))}
                            {Object.keys(shareByPlatform).length === 0 && (
                                <p className="text-gray-600 text-sm italic">No share data yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="text-indigo-400">🔔</span> Recent Activity
                        </h2>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {events.slice(0, 20).map((event) => (
                                <div key={event.id} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-black uppercase text-indigo-400 tracking-tighter">
                                            {event.event_name.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-600">
                                            {new Date(event.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 truncate">
                                        {JSON.stringify(event.properties)}
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <p className="text-gray-600 text-sm italic">Waiting for events...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
    return (
        <div className="bg-[#0A0D14] border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Active</span>
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h3>
            <p className={`text-4xl font-black ${color}`}>{value}</p>
        </div>
    );
}
