import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import es from "../../messages/es.json";
import en from "../../messages/en.json";

const publicView = readFileSync("components/report/PublicReportView.tsx", "utf8");
const ownerPage = readFileSync("app/[locale]/analyzer/report/[report_id]/page.tsx", "utf8");
const ownerView = readFileSync("components/report/OwnerReportView.tsx", "utf8");

describe("public and owner report navigation", () => {
    it("gives the authenticated owner an exact same-report full-report route", () => {
        expect(es.publicReport.ownerCta).toBe("Ver reporte completo");
        expect(en.publicReport.ownerCta).toBe("View full report");
        expect(publicView).toContain('`/${locale}/analyzer/report/${report.id}`');
        expect(publicView).not.toContain('isOwner ? "dashboard" : "analyzer"');
        expect(es.publicReport.ownerCta).not.toContain("Volver");
    });

    it("shows visitors the analyzer action without private controls", () => {
        expect(es.publicReport.visitorCta).toBe("Analizar mi estrategia");
        expect(en.publicReport.visitorCta).toBe("Analyze my strategy");
        expect(publicView).toContain(': `/${locale}/analyzer`');
        expect(publicView).toContain("{!isOwner && <div");
    });

    it("hides the create-report footer from owners and keeps Dashboard secondary", () => {
        expect(publicView).toContain("{isOwner && (");
        expect(publicView).toContain('href={`/${locale}/dashboard`}');
        expect(publicView).toContain("{!isOwner && <div");
        expect(es.publicReport.dashboardCta).toBe("Ir al Dashboard");
    });

    it("authorizes the private route from persisted ownership server-side", () => {
        expect(ownerPage).toContain('.eq("id", params.report_id)');
        expect(ownerPage).toContain('.eq("user_id", user.id)');
        expect(ownerPage).toContain("report.user_id !== user.id");
        expect(ownerPage).not.toContain("searchParams");
    });

    it("loads the persisted report without creating a new analysis", () => {
        expect(ownerPage).toContain("normalizePublicReportMetrics(report)");
        expect(ownerView).toContain("analysisId={reportId}");
        expect(ownerPage).not.toContain("/api/analyzer/save");
        expect(ownerView).not.toContain("/api/analyzer/save");
    });

    it("keeps FullReport out of the public summary", () => {
        expect(publicView).not.toContain('import FullReport');
        expect(publicView).not.toContain("<FullReport");
    });
});
