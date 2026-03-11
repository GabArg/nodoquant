import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import CreateProject from "@/components/dashboard/CreateProject";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    const dbClient = getSupabaseServer();
    let projects: any[] = [];

    if (dbClient && user) {
        // Fetch projects + their analysis counts
        const { data } = await dbClient
            .from("projects")
            .select("id, name, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        projects = data || [];

        // Populate counts manually if postgREST relationships aren't strictly defined
        for (let p of projects) {
            const { count } = await dbClient
                .from("trade_analysis")
                .select("id", { count: "exact", head: true })
                .eq("project_id", p.id);
            p.analysisCount = count || 0;
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tus Proyectos</h1>
                    <p className="text-gray-400">Agrupá y organizá tus backtests por estrategia.</p>
                </div>
            </header>

            <div className="max-w-md">
                <CreateProject />
            </div>

            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-gray-500 card rounded-2xl border border-white/5 bg-[#111118]">
                            Todavía no tenés ningún proyecto. Empezá creando uno arriba.
                        </div>
                    ) : (
                        projects.map(p => (
                            <div key={p.id} className="card rounded-2xl p-6 border border-white/5 bg-[#111118] hover:border-indigo-500/30 transition-colors">
                                <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Creado el {new Date(p.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-indigo-400">{p.analysisCount}</span>
                                    <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">análisis</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
