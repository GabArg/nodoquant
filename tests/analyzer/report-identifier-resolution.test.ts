import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { isUuid, applyReportIdentifierFilter } from "@/lib/auth/reportAccess";

// Mock auth client and Supabase clients
let mockCurrentUser: { id: string; email?: string } | null = null;
let mockTradeAnalysisData: any = null;
let mockTradeAnalysisError: any = null;

let lastSelectClause: string | null = null;
let lastOrClause: string | null = null;
let lastEqCalls: Array<{ column: string; value: any }> = [];

vi.mock("@/lib/auth/server", () => ({
    createClient: () => ({
        auth: {
            getUser: vi.fn().mockImplementation(async () => ({
                data: { user: mockCurrentUser },
                error: null,
            })),
        },
    }),
}));

const mockSingleTradeAnalysis = vi.fn().mockImplementation(async () => ({
    data: mockTradeAnalysisData,
    error: mockTradeAnalysisError,
}));

const mockSupabaseQueryBuilder: any = {
    select: vi.fn().mockImplementation((columns: string) => {
        lastSelectClause = columns;
        return mockSupabaseQueryBuilder;
    }),
    or: vi.fn().mockImplementation((clause: string) => {
        lastOrClause = clause;
        return mockSupabaseQueryBuilder;
    }),
    eq: vi.fn().mockImplementation((column: string, value: any) => {
        lastEqCalls.push({ column, value });
        return mockSupabaseQueryBuilder;
    }),
    single: mockSingleTradeAnalysis,
};

const mockSupabaseInstance = {
    from: vi.fn().mockImplementation((table: string) => {
        if (table === "trade_analysis") {
            return mockSupabaseQueryBuilder;
        }
        return {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
        };
    }),
};

vi.mock("@/lib/supabase", () => ({
    getSupabaseServer: vi.fn().mockImplementation(() => mockSupabaseInstance),
}));

vi.mock("@/lib/supabase-admin", () => ({
    getSupabaseAdmin: vi.fn().mockImplementation(() => mockSupabaseInstance),
}));

// Route handlers
import { GET as getPublicReport } from "@/app/api/report/[public_id]/route";
import { GET as getAnalyzerReport } from "@/app/api/analyzer/report/[report_id]/route";

describe("Report Identifier Resolution & Route Security Suite", () => {
    const OWNER_ID = "00000000-0000-4000-a000-000000000001";
    const THIRDPARTY_ID = "00000000-0000-4000-a000-000000000002";
    const VALID_UUID = "10000000-0000-4000-a000-000000000001";
    const VALID_SLUG = "qa-public-alpha";
    const PRIVATE_SLUG = "qa-private-beta";

    const basePublicReport = {
        id: VALID_UUID,
        public_id: VALID_SLUG,
        user_id: OWNER_ID,
        is_public: true,
        dataset_name: "Trend Following EURUSD QA",
        file_name: "Trend Following EURUSD QA",
        trades_count: 320,
        winrate: 62.5,
        profit_factor: 2.15,
        max_drawdown: 12.4,
        metrics_json: {
            strategy_score: 85,
            quant_score: 85,
            equity_curve: [1000, 1050, 1120],
        },
        strategies: [{ name: "Alpha Trend", category: "forex" }],
    };

    const basePrivateReport = {
        ...basePublicReport,
        id: "20000000-0000-4000-a000-000000000002",
        public_id: PRIVATE_SLUG,
        is_public: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser = null;
        mockTradeAnalysisData = null;
        mockTradeAnalysisError = null;
        lastSelectClause = null;
        lastOrClause = null;
        lastEqCalls = [];
    });

    // =========================================================================
    // 1. UNIT TESTS: isUuid & applyReportIdentifierFilter
    // =========================================================================
    describe("1. isUuid helper", () => {
        it("returns true for standard canonical lowercase UUID v4", () => {
            expect(isUuid("10000000-0000-4000-a000-000000000001")).toBe(true);
            expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
        });

        it("returns true for standard uppercase UUID", () => {
            expect(isUuid("10000000-0000-4000-A000-000000000001")).toBe(true);
        });

        it("returns true for UUID with leading/trailing whitespace (trimmed)", () => {
            expect(isUuid("  10000000-0000-4000-a000-000000000001  ")).toBe(true);
        });

        it("returns false for non-UUID text slugs", () => {
            expect(isUuid("qa-public-alpha")).toBe(false);
            expect(isUuid("qa-private-beta")).toBe(false);
            expect(isUuid("qa-edge-nulls")).toBe(false);
            expect(isUuid("pub-123")).toBe(false);
            expect(isUuid("analysis-uuid-1234")).toBe(false);
        });

        it("returns false for invalid UUIDs (wrong group lengths, invalid chars)", () => {
            expect(isUuid("10000000-0000-4000-a000-00000000000g")).toBe(false); // non-hex
            expect(isUuid("10000000-0000-4000-a000-0000000000001")).toBe(false); // too long
            expect(isUuid("10000000-0000-4000-a000")).toBe(false); // incomplete
        });

        it("returns false for null, undefined, empty string or malicious payloads", () => {
            expect(isUuid(null)).toBe(false);
            expect(isUuid(undefined)).toBe(false);
            expect(isUuid("")).toBe(false);
            expect(isUuid("   ")).toBe(false);
            expect(isUuid("10000000-0000-4000-a000-000000000001' OR 1=1--")).toBe(false);
            expect(isUuid("../../../etc/passwd")).toBe(false);
        });
    });

    describe("2. applyReportIdentifierFilter query builder", () => {
        it("branches to .or('id.eq...,public_id.eq...') when identifier is a UUID", () => {
            const fakeQuery = {
                or: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
            };

            applyReportIdentifierFilter(fakeQuery, "10000000-0000-4000-a000-000000000001");

            expect(fakeQuery.or).toHaveBeenCalledTimes(1);
            expect(fakeQuery.or).toHaveBeenCalledWith(
                "id.eq.10000000-0000-4000-a000-000000000001,public_id.eq.10000000-0000-4000-a000-000000000001"
            );
            expect(fakeQuery.eq).not.toHaveBeenCalled();
        });

        it("branches to .eq('public_id', slug) when identifier is a text slug (preventing Postgres 22P02)", () => {
            const fakeQuery = {
                or: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
            };

            applyReportIdentifierFilter(fakeQuery, "qa-public-alpha");

            expect(fakeQuery.eq).toHaveBeenCalledTimes(1);
            expect(fakeQuery.eq).toHaveBeenCalledWith("public_id", "qa-public-alpha");
            expect(fakeQuery.or).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // 2. ENDPOINT SCENARIOS: GET /api/report/[public_id]
    // =========================================================================
    describe("3. GET /api/report/[public_id] - 8 User Requirement Scenarios", () => {
        // Scenario 1: Valid existing UUID
        it("Scenario 1: returns 200 with report data when queried by valid existing UUID", async () => {
            mockTradeAnalysisData = basePublicReport;

            const req = new NextRequest(`http://localhost/api/report/${VALID_UUID}`);
            const res = await getPublicReport(req, { params: { public_id: VALID_UUID } });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.data.public_id).toBe(VALID_SLUG);
            expect(json.data.metrics.profit_factor).toBe(2.15);
            expect(json.data.metrics.max_drawdown).toBe(12.4);

            // Verifies it queried with .or() for UUID
            expect(lastOrClause).toBe(`id.eq.${VALID_UUID},public_id.eq.${VALID_UUID}`);
        });

        // Scenario 2: Valid existing public slug
        it("Scenario 2: returns 200 with report data when queried by valid existing public slug", async () => {
            mockTradeAnalysisData = basePublicReport;

            const req = new NextRequest(`http://localhost/api/report/${VALID_SLUG}`);
            const res = await getPublicReport(req, { params: { public_id: VALID_SLUG } });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.data.public_id).toBe(VALID_SLUG);
            expect(json.data.metrics.profit_factor).toBe(2.15);
            expect(json.data.dataset_name).toBe("Trend Following EURUSD QA");

            // Verifies it queried with .eq('public_id') and NOT .or()
            expect(lastOrClause).toBeNull();
            expect(lastEqCalls).toContainEqual({ column: "public_id", value: VALID_SLUG });
        });

        // Scenario 3: Non-existent slug
        it("Scenario 3: returns 404 'Report not found' for non-existent slug without database error leakage", async () => {
            mockTradeAnalysisData = null;
            mockTradeAnalysisError = { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" };

            const req = new NextRequest("http://localhost/api/report/non-existent-slug");
            const res = await getPublicReport(req, { params: { public_id: "non-existent-slug" } });

            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Report not found");
            expect(json.details).toBeUndefined(); // No internal Postgres error leakage
        });

        // Scenario 4: Non-existent UUID
        it("Scenario 4: returns 404 'Report not found' for non-existent UUID without database error leakage", async () => {
            const nonExistentUuid = "99999999-9999-4999-a999-999999999999";
            mockTradeAnalysisData = null;
            mockTradeAnalysisError = { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" };

            const req = new NextRequest(`http://localhost/api/report/${nonExistentUuid}`);
            const res = await getPublicReport(req, { params: { public_id: nonExistentUuid } });

            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Report not found");
            expect(json.details).toBeUndefined();
        });

        // Scenario 5: Private slug accessed by anonymous visitor
        it("Scenario 5: returns 404 and does not leak private report data to anonymous visitor", async () => {
            mockCurrentUser = null;
            mockTradeAnalysisData = basePrivateReport;

            const req = new NextRequest(`http://localhost/api/report/${PRIVATE_SLUG}`);
            const res = await getPublicReport(req, { params: { public_id: PRIVATE_SLUG } });

            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Report not found");
            expect(json.data).toBeUndefined();
        });

        // Scenario 6: Private slug accessed by 3rd-party user
        it("Scenario 6: returns 404 and does not leak private report data to unauthorized 3rd-party user", async () => {
            mockCurrentUser = { id: THIRDPARTY_ID };
            mockTradeAnalysisData = basePrivateReport;

            const req = new NextRequest(`http://localhost/api/report/${PRIVATE_SLUG}`);
            const res = await getPublicReport(req, { params: { public_id: PRIVATE_SLUG } });

            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Report not found");
            expect(json.data).toBeUndefined();
        });

        // Scenario 7: Private slug accessed by owner
        it("Scenario 7: returns 200 with private cache-control headers when accessed by legitimate owner", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = basePrivateReport;

            const req = new NextRequest(`http://localhost/api/report/${PRIVATE_SLUG}`);
            const res = await getPublicReport(req, { params: { public_id: PRIVATE_SLUG } });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.data.public_id).toBe(PRIVATE_SLUG);

            const cacheHeader = res.headers.get("Cache-Control");
            expect(cacheHeader).toBe("private, no-cache, no-store, must-revalidate");
        });

        // Scenario 8: Malformed / potentially malicious input
        it("Scenario 8: returns 404 immediately for malformed / malicious identifier inputs", async () => {
            const maliciousInputs = [
                "qa-slug' OR 1=1--",
                "../../secret",
                "rep; DROP TABLE trade_analysis;",
                "<script>alert(1)</script>",
                "slug with spaces",
                "slug#hash",
            ];

            for (const input of maliciousInputs) {
                const req = new NextRequest(`http://localhost/api/report/${encodeURIComponent(input)}`);
                const res = await getPublicReport(req, { params: { public_id: input } });

                expect(res.status).toBe(404);
                const json = await res.json();
                expect(json.error).toBe("Report not found");
                expect(json.details).toBeUndefined();
            }
        });
    });

    // =========================================================================
    // 3. ENDPOINT SCENARIOS: GET /api/analyzer/report/[report_id]
    // =========================================================================
    describe("4. GET /api/analyzer/report/[report_id] - Resolution & Security", () => {
        it("resolves report by slug without throwing 22P02", async () => {
            mockTradeAnalysisData = basePublicReport;

            const req = new NextRequest(`http://localhost/api/analyzer/report/${VALID_SLUG}`);
            const res = await getAnalyzerReport(req, { params: { report_id: VALID_SLUG } });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.report.public_id).toBe(VALID_SLUG);
            expect(lastEqCalls).toContainEqual({ column: "public_id", value: VALID_SLUG });
        });

        it("resolves report by UUID using .or() filter", async () => {
            mockTradeAnalysisData = basePublicReport;

            const req = new NextRequest(`http://localhost/api/analyzer/report/${VALID_UUID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: VALID_UUID } });

            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.report.id).toBe(VALID_UUID);
            expect(lastOrClause).toBe(`id.eq.${VALID_UUID},public_id.eq.${VALID_UUID}`);
        });

        it("denies 3rd party user access to private report (404)", async () => {
            mockCurrentUser = { id: THIRDPARTY_ID };
            mockTradeAnalysisData = basePrivateReport;

            const req = new NextRequest(`http://localhost/api/analyzer/report/${PRIVATE_SLUG}`);
            const res = await getAnalyzerReport(req, { params: { report_id: PRIVATE_SLUG } });

            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.ok).toBe(false);
            expect(json.report).toBeUndefined();
        });
    });
});
