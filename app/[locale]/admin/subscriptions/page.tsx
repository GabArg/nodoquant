import { getSupabaseServer } from "@/lib/supabase";
import { createClient } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) redirect("/login");

    const supabase = getSupabaseServer();
    if (!supabase) return <div>DB Error</div>;

    // Fetch all subscriptions joined with user profiles
    const { data: subscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
            id,
            user_id,
            lemonsqueezy_subscription_id,
            status,
            plan,
            current_period_end,
            created_at
        `)
        .order("created_at", { ascending: false });

    // Also fetch user emails from user_profiles
    const userIds = subscriptions?.map((s) => s.user_id) ?? [];
    const { data: profiles } = userIds.length
        ? await supabase
            .from("user_profiles")
            .select("id, email, plan")
            .in("id", userIds)
        : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    if (error) {
        return (
            <main className="p-8 text-white">
                <h1 className="text-2xl font-bold mb-4">Admin — Subscriptions</h1>
                <p className="text-red-400">Error loading subscriptions: {error.message}</p>
            </main>
        );
    }

    return (
        <main className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Admin — Subscriptions</h1>
                <p className="text-gray-400">{subscriptions?.length ?? 0} total users</p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-left p-4 text-gray-400 font-medium">User</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                            <th className="text-left p-4 text-gray-400 font-medium">Period End</th>
                            <th className="text-left p-4 text-gray-400 font-medium">LS Subscription ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(subscriptions ?? []).map((sub) => {
                            const profile = profileMap[sub.user_id];
                            const isPro = sub.plan === "pro";
                            const isActive = sub.status === "active";
                            return (
                                <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="text-white text-xs font-mono">{profile?.email ?? sub.user_id.slice(0, 8) + "..."}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isPro ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-gray-400"}`}>
                                            {sub.plan?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400 text-xs">
                                        {sub.current_period_end
                                            ? new Date(sub.current_period_end).toLocaleDateString("es-AR")
                                            : "—"}
                                    </td>
                                    <td className="p-4 text-gray-500 font-mono text-xs">
                                        {sub.lemonsqueezy_subscription_id ?? "—"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
