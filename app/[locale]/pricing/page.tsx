import { createClient } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase";
import PricingPlan from "@/components/pricing/PricingPlan";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    let isPro = false;
    if (user) {
        const supabase = getSupabaseServer();
        if (supabase) {
            const { data: profile } = await supabase
                .from("user_profiles")
                .select("plan")
                .eq("id", user.id)
                .single();
            isPro = profile?.plan === "pro";
        }
    }

    if (isPro) {
        return (
            <main className="min-h-screen bg-[#07090F] pt-10 flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                        ✨
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">¡Ya sos Pro!</h1>
                    <p className="text-gray-400 mb-8">
                        Tenés acceso completo a todas las herramientas avanzadas de NodoQuant Pro.
                    </p>
                    <Link href="/dashboard" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all inline-block">
                        Ir al Dashboard →
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#07090F] pt-10">
            <PricingPlan isPro={false} />
        </main>
    );
}
