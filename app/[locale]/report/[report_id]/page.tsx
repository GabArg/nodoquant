import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import PublicReportView from "@/components/report/PublicReportView";
import type { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

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
            .select("metrics_json, file_name, trades_count")
            .eq("id", params.report_id)
            .single();

        if (!data) return { title: "Reporte no encontrado — NodoQuant" };

        const metrics = data.metrics_json as any;
        const score = Math.round(metrics?.advanced?.edgeConfidence ?? 0);
        
        // This dynamic title provokes curiosity and establishes credibility:
        const metaTitle = `This strategy scores ${score}/100 — Is it actually profitable?`;
        const metaDesc = `Quantitative analysis of ${data.trades_count} trades. View the full Monte Carlo simulation and Expectancy report.`;
        
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

    return (
        <main className="bg-[#050505]">
            <PublicReportView report={data} />
        </main>
    );
}
