import { createClient } from "@/lib/auth/server";
import { getUserPlanStatus } from "@/lib/payments/subscription";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: { locale: string } }) {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const plan = user ? await getUserPlanStatus(user.id) : null;
    const es = params.locale === "es";

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-12">
            <div className="max-w-3xl mx-auto px-4">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">{es ? "Mi cuenta" : "My account"}</h1>
                    <p className="text-gray-400">{es ? "Gestioná tu perfil y acceso a la beta." : "Manage your profile and beta access."}</p>
                </header>
                <div className="space-y-6">
                    <div className="card rounded-2xl p-6 border border-white/5 bg-[#111118]">
                        <h2 className="text-lg font-bold mb-4">{es ? "Información personal" : "Personal information"}</h2>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-base text-gray-300">{user?.email}</p>
                    </div>
                    <div className="card rounded-2xl p-6 border border-indigo-500/20 bg-indigo-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">{es ? "Acceso actual" : "Current access"}</h2>
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider rounded-full border border-indigo-500/30">{plan?.isPro ? "PRO" : "BETA"}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">{plan?.isPro ? (es ? "Tu acceso Pro histórico continúa activo." : "Your historical Pro access remains active.") : (es ? "La beta gratuita permite hasta 500 trades por análisis y 1 análisis guardado." : "The free beta allows up to 500 trades per analysis and 1 saved analysis.")}</p>
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-center text-gray-500">{es ? "No hay planes pagos ni checkout disponibles durante la beta." : "No paid plans or checkout are available during beta."}</div>
                    </div>
                    <form action={`/${params.locale}/auth/signout`} method="POST">
                        <button type="submit" className="text-sm text-red-400 hover:text-red-300 font-medium">{es ? "Cerrar sesión" : "Sign out"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
