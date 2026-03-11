import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    const dbClient = getSupabaseServer();
    let profile = { plan: "free" };

    if (dbClient && user) {
        const { data } = await dbClient
            .from("user_profiles")
            .select("plan")
            .eq("id", user.id)
            .single();
        if (data) profile = data;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Mi Cuenta</h1>
                    <p className="text-gray-400">Gestioná tu perfil y plan de suscripción.</p>
                </header>

                <div className="space-y-6">
                    <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                        <h2 className="text-lg font-bold text-white mb-4">Información Personal</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-base text-gray-300">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User ID</p>
                                <p className="text-sm font-mono text-gray-500 break-all">{user?.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Plan Actual</h2>
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30">
                                {profile.plan}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            Estás usando el plan {profile.plan}. Actualmente tenés acceso completo de analista cuantitativo de prueba.
                        </p>

                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-center text-gray-500">
                            Mejoras de plan próximamente a través de Lemon Squeezy o Stripe.
                        </div>
                    </div>

                    <div className="pt-4">
                        <form action="/auth/signout" method="POST">
                            <button type="submit" className="text-sm text-red-400 hover:text-red-300 font-medium">
                                Cerrar sesión
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
