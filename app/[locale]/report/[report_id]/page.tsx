import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import PublicReportView from "@/components/report/PublicReportView";
import type { Metadata } from "next";
import { normalizePublicReportMetrics } from "@/lib/analyzer/publicReportMetrics";
import { createClient } from "@/lib/auth/server";

export const revalidate = 3600; // Cache for 1 hour
export const dynamic = "force-dynamic";

interface PageProps {
    params: {
        locale: string;
        report_id: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const adminClient = getSupabaseAdmin();
        const { data } = await adminClient
            .from("trade_analysis")
            .select("metrics_json, file_name, trades_count, winrate, profit_factor, max_drawdown, sum_profit")
            .eq("id", params.report_id)
            .single();

        if (!data) return { title: "Reporte no encontrado — NodoQuant" };

        const metrics = normalizePublicReportMetrics(data);
        const edgeConfidence = Math.round(metrics?.advanced?.edgeConfidence ?? 0);
        const isSpanish = params.locale === "es";
        
        // This dynamic title provokes curiosity and establishes credibility:
        const metaTitle = isSpanish
            ? `Confianza del edge: ${edgeConfidence}/100 — NodoQuant`
            : `Edge Confidence: ${edgeConfidence}/100 — NodoQuant`;
        const metaDesc = isSpanish
            ? `Diagnóstico cuantitativo basado en ${data.trades_count} operaciones.`
            : `Quantitative diagnosis based on ${data.trades_count} trades.`;
        
        return {
            title: metaTitle,
            description: metaDesc,
            openGraph: {
                title: metaTitle,
                description: metaDesc,
                type: "website",
                siteName: "NodoQuant",
            },
            twitter: {
                card: "summary_large_image",
                title: metaTitle,
                description: metaDesc,
            }
        };
    } catch (e) {
        return { title: "Strategy Report — NodoQuant" };
    }
}

export default async function PublicReportPage({ params }: PageProps) {
    if (!params.report_id || params.report_id.length < 10) return notFound();

    // Fetch using Admin Privileges
    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
        .from("trade_analysis")
        .select("*")
        .eq("id", params.report_id)
        .single();

    if (error || !data) {
        console.warn(`[Public Report] Failed to find id ${params.report_id}:`, error?.message);
        return notFound();
    }

    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    const isOwner = Boolean(user && user.id === data.user_id);

    return (
        <main className="bg-[#050505]">
            <PublicReportView report={data} isOwner={isOwner} />
        </main>
    );
}
