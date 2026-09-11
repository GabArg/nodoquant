import { notFound } from "next/navigation";
import { createClient } from "@/lib/auth/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getUserEntitlement } from "@/lib/payments/entitlements";
import { normalizePublicReportMetrics } from "@/lib/analyzer/publicReportMetrics";
import OwnerReportView from "@/components/report/OwnerReportView";

interface PageProps {
    params: { locale: string; report_id: string };
}

export const dynamic = "force-dynamic";

export default async function OwnerReportPage({ params }: PageProps) {
    const authClient = createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) notFound();

    const adminClient = getSupabaseAdmin();
    const { data: report, error } = await adminClient
        .from("trade_analysis")
        .select("*")
        .eq("id", params.report_id)
        .eq("user_id", user.id)
        .single();

    if (error || !report || report.user_id !== user.id) notFound();

    const normalized = normalizePublicReportMetrics(report);
    const entitlement = await getUserEntitlement(adminClient, { id: user.id, email: user.email });

    return (
        <OwnerReportView
            reportId={report.id}
            metrics={normalized.metrics}
            edgeConfidence={normalized.edgeConfidence}
            isPro={entitlement.isPro}
        />
    );
}
