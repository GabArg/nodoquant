import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import PublicReportView from "@/components/report/PublicReportView";
import type { Metadata } from "next";
import { createClient } from "@/lib/auth/server";
import { canAccessReport, applyReportIdentifierFilter } from "@/lib/auth/reportAccess";

export const dynamic = "force-dynamic";

interface PageProps {
    params: {
        locale: string;
        report_id: string;
    };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const id = params.report_id;
        if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return {
                title: "Reporte no encontrado — NodoQuant",
                robots: { index: false, follow: false },
            };
        }

        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();

        const adminClient = getSupabaseAdmin();
        const baseQuery = adminClient
            .from("trade_analysis")
            .select("metrics_json, file_name, trades_count, is_public, user_id");

        const { data } = await applyReportIdentifierFilter(baseQuery, id).single();

        if (!data || !canAccessReport(data, user?.id)) {
            return {
                title: "Reporte no encontrado — NodoQuant",
                description: "El reporte solicitado no existe o no está disponible públicamente.",
                robots: { index: false, follow: false },
            };
        }

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
        return {
            title: "Strategy Report — NodoQuant",
            robots: { index: false, follow: false },
        };
    }
}

export default async function PublicReportPage({ params }: PageProps) {
    const id = params.report_id;
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || id.length < 5) return notFound();

    // Fetch using Admin Privileges
    const adminClient = getSupabaseAdmin();
    const baseQuery = adminClient
        .from("trade_analysis")
        .select("*");

    const { data, error } = await applyReportIdentifierFilter(baseQuery, id).single();

    if (error || !data) {
        console.warn(`[Public Report] Failed to find id ${params.report_id}:`, error?.message);
        return notFound();
    }

    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();

    // Si el análisis no es público y el usuario actual no es el dueño, denegar acceso
    if (!canAccessReport(data, user?.id)) {
        return notFound();
    }

    return (
        <main className="bg-[#050505]">
            <PublicReportView report={data} />
        </main>
    );
}

