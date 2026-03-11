import Link from "next/link";
import { createClient } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-12">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Portal SaaS</p>
                        <nav className="flex flex-col gap-1 inline-block w-full">
                            <Link href="/dashboard" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors block">
                                Overview
                            </Link>
                            <Link href="/dashboard/projects" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors block">
                                Projects
                            </Link>
                            <Link href="/dashboard/strategies" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-indigo-300 hover:text-white transition-colors block">
                                Strategy Lab
                            </Link>
                            <Link href="/dashboard/compare" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors block">
                                Compare
                            </Link>
                            <Link href="/analyzer" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors block">
                                Strategy Analyzer
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Settings</p>
                        <nav className="flex flex-col gap-1 inline-block w-full">
                            <Link href="/account" className="px-4 py-2.5 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors block">
                                Mi Cuenta
                            </Link>
                        </nav>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                                {user?.email?.charAt(0).toUpperCase() ?? "U"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
