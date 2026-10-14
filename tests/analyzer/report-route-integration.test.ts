import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth client and Supabase clients
let mockCurrentUser: { id: string; email?: string } | null = null;
let mockTradeAnalysisData: any = null;
let mockTradeAnalysisError: any = null;

let lastTradeAnalysisUpdate: any = null;
let lastStrategyProfileUpsert: any = null;

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

vi.mock("@/lib/slugs", () => ({
    generateUniqueSlug: vi.fn().mockResolvedValue("test-strategy-slug"),
}));

const mockSingleTradeAnalysis = vi.fn().mockImplementation(async () => ({
    data: mockTradeAnalysisData,
    error: mockTradeAnalysisError,
}));

const mockSupabaseInstance = {
    from: vi.fn().mockImplementation((table: string) => {
        if (table === "trade_analysis") {
            return {
                select: vi.fn().mockReturnValue({
                    or: vi.fn().mockReturnValue({ single: mockSingleTradeAnalysis }),
                    eq: vi.fn().mockReturnValue({
                        single: mockSingleTradeAnalysis,
                        eq: vi.fn().mockReturnValue({ single: mockSingleTradeAnalysis }),
                    }),
                }),
                update: vi.fn().mockImplementation((payload: any) => {
                    lastTradeAnalysisUpdate = payload;
                    return {
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null }),
                        }),
                    };
                }),
            };
        }
        if (table === "public_strategy_profiles") {
            return {
                upsert: vi.fn().mockImplementation((payload: any) => {
                    lastStrategyProfileUpsert = payload;
                    return {
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { slug: payload.slug || "test-strategy-slug" },
                                error: null,
                            }),
                        }),
                    };
                }),
            };
        }
        if (table === "user_subscriptions") {
            return {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                }),
            };
        }
        return {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({ single: mockSingleTradeAnalysis }),
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

vi.mock("@/lib/payments/subscription", () => ({
    getUserSubscription: vi.fn().mockResolvedValue({ tier: "free", status: "active" }),
    isProUser: vi.fn().mockReturnValue(false),
}));

// Route handlers
import { GET as getAnalyzerReport } from "@/app/api/analyzer/report/[report_id]/route";
import { GET as getPublicReport } from "@/app/api/report/[public_id]/route";
import { POST as publishStrategy } from "@/app/api/strategies/publish/route";

describe("Isolated Integration Tests: Report & Strategy Security API Routes", () => {
    const OWNER_ID = "00000000-0000-0000-0000-000000000001";
    const THIRDPARTY_ID = "00000000-0000-0000-0000-000000000002";
    const REPORT_ID = "analysis-uuid-1234";

    const baseReport = {
        id: REPORT_ID,
        public_id: "pub-code-123",
        user_id: OWNER_ID,
        dataset_name: "XAUUSD_M15_2024.csv",
        file_name: "XAUUSD_M15_2024.csv",
        trades_count: 320,
        winrate: 62.5,
        profit_factor: 1.85,
        max_drawdown: 12.4,
        metrics_json: {
            strategy_score: 78,
            quant_score: 78,
            equity_curve: [1000, 1050, 1120],
            advanced: { edgeConfidence: 85, verdict: "strongEdge" },
        },
        strategies: [{ name: "Gold Breakout", category: "commodities" }],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser = null;
        mockTradeAnalysisData = null;
        mockTradeAnalysisError = null;
        lastTradeAnalysisUpdate = null;
        lastStrategyProfileUpsert = null;
    });

    describe("1. GET /api/analyzer/report/[report_id]", () => {
        it("returns 404 for invalid ID formats (SQL injection / path traversal)", async () => {
            const req = new NextRequest("http://localhost/api/analyzer/report/bad%20id;drop");
            const res = await getAnalyzerReport(req, { params: { report_id: "bad id;drop" } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.ok).toBe(false);
            expect(json.error).toBe("Reporte no encontrado");
        });

        it("returns 404 when report does not exist in DB", async () => {
            mockTradeAnalysisData = null;
            mockTradeAnalysisError = { message: "No rows found" };

            const req = new NextRequest(`http://localhost/api/analyzer/report/${REPORT_ID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: REPORT_ID } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.ok).toBe(false);
        });

        it("denies anonymous access to private report (404 and no data leaked)", async () => {
            mockCurrentUser = null;
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/analyzer/report/${REPORT_ID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: REPORT_ID } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.ok).toBe(false);
            expect(json.report).toBeUndefined();
        });

        it("denies 3rd party authenticated access to private report (404)", async () => {
            mockCurrentUser = { id: THIRDPARTY_ID };
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/analyzer/report/${REPORT_ID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: REPORT_ID } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.ok).toBe(false);
            expect(json.report).toBeUndefined();
        });

        it("allows owner access to private report with private Cache-Control headers", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/analyzer/report/${REPORT_ID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: REPORT_ID } });
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.report.id).toBe(REPORT_ID);

            const cacheHeader = res.headers.get("Cache-Control");
            expect(cacheHeader).toBe("private, no-cache, no-store, must-revalidate");
        });

        it("allows anonymous access to public report with shared public Cache-Control headers", async () => {
            mockCurrentUser = null;
            mockTradeAnalysisData = { ...baseReport, is_public: true };

            const req = new NextRequest(`http://localhost/api/analyzer/report/${REPORT_ID}`);
            const res = await getAnalyzerReport(req, { params: { report_id: REPORT_ID } });
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.report.id).toBe(REPORT_ID);

            const cacheHeader = res.headers.get("Cache-Control");
            expect(cacheHeader).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
        });
    });

    describe("2. GET /api/report/[public_id]", () => {
        it("returns 404 for invalid identifier syntax", async () => {
            const req = new NextRequest("http://localhost/api/report/bad!syntax");
            const res = await getPublicReport(req, { params: { public_id: "bad!syntax" } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Report not found");
        });

        it("denies access to private report for anonymous visitor (404)", async () => {
            mockCurrentUser = null;
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/report/${REPORT_ID}`);
            const res = await getPublicReport(req, { params: { public_id: REPORT_ID } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.data).toBeUndefined();
        });

        it("denies access to private report for unauthorized 3rd party user (404)", async () => {
            mockCurrentUser = { id: THIRDPARTY_ID };
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/report/${REPORT_ID}`);
            const res = await getPublicReport(req, { params: { public_id: REPORT_ID } });
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.data).toBeUndefined();
        });

        it("grants access to owner for private report with private Cache-Control", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { ...baseReport, is_public: false };

            const req = new NextRequest(`http://localhost/api/report/${REPORT_ID}`);
            const res = await getPublicReport(req, { params: { public_id: REPORT_ID } });
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);
            expect(json.data.metrics.total_trades).toBe(320);

            const cacheHeader = res.headers.get("Cache-Control");
            expect(cacheHeader).toBe("private, no-cache, no-store, must-revalidate");
        });

        it("grants access to public report with public Cache-Control", async () => {
            mockCurrentUser = null;
            mockTradeAnalysisData = { ...baseReport, is_public: true };

            const req = new NextRequest(`http://localhost/api/report/${REPORT_ID}`);
            const res = await getPublicReport(req, { params: { public_id: REPORT_ID } });
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);

            const cacheHeader = res.headers.get("Cache-Control");
            expect(cacheHeader).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
        });
    });

    describe("3. POST /api/strategies/publish (Authorization & Visibility Hardening)", () => {
        const publishPayload = {
            report_id: REPORT_ID,
            strategy_name: "Scalping Gold M15",
            description: "High probability trend following",
            visibility: "public",
            market: "Commodities",
            symbol: "XAUUSD",
            score: 82,
            win_rate: 65,
            profit_factor: 2.1,
            trades_count: 320,
        };

        it("denies unauthenticated requests with 401", async () => {
            mockCurrentUser = null;
            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify(publishPayload),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(401);
            const json = await res.json();
            expect(json.error).toBe("Unauthorized");
        });

        it("rejects invalid report_id regex or missing name with 400", async () => {
            mockCurrentUser = { id: OWNER_ID };
            const badReq = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify({ ...publishPayload, report_id: "id;drop table" }),
            });
            const res = await publishStrategy(badReq);
            expect(res.status).toBe(400);
        });

        it("returns 404 when report does not exist in DB", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = null;
            mockTradeAnalysisError = { message: "Not found" };

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify(publishPayload),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(404);
            const json = await res.json();
            expect(json.error).toBe("Reporte no encontrado");
        });

        it("strictly denies publishing anonymous reports (user_id = null) with 403", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { id: REPORT_ID, user_id: null, is_public: false };

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify(publishPayload),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.error).toBe("No autorizado para publicar este reporte");
        });

        it("strictly denies third-party users attempting to publish someone else's report (403 BOLA prevention)", async () => {
            mockCurrentUser = { id: THIRDPARTY_ID }; // Authenticated attacker
            mockTradeAnalysisData = { id: REPORT_ID, user_id: OWNER_ID, is_public: false }; // Victim's report

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify(publishPayload),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(403);
            const json = await res.json();
            expect(json.error).toBe("No autorizado para publicar este reporte");
            // Ensure no update occurred
            expect(lastTradeAnalysisUpdate).toBeNull();
        });

        it("allows legitimate owner to publish with public visibility and updates trade_analysis.is_public", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { id: REPORT_ID, user_id: OWNER_ID, is_public: false };

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify({ ...publishPayload, visibility: "public" }),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.ok).toBe(true);

            expect(lastStrategyProfileUpsert.visibility).toBe("public");
            expect(lastStrategyProfileUpsert.user_id).toBe(OWNER_ID);
            expect(lastTradeAnalysisUpdate).toEqual({ is_public: true });
        });

        it("allows owner to publish with unlisted visibility and updates trade_analysis.is_public to true", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { id: REPORT_ID, user_id: OWNER_ID, is_public: false };

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify({ ...publishPayload, visibility: "unlisted" }),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(200);

            expect(lastStrategyProfileUpsert.visibility).toBe("unlisted");
            expect(lastTradeAnalysisUpdate).toEqual({ is_public: true });
        });

        it("allows owner to save as private visibility and ensures trade_analysis remains private", async () => {
            mockCurrentUser = { id: OWNER_ID };
            mockTradeAnalysisData = { id: REPORT_ID, user_id: OWNER_ID, is_public: false };

            const req = new NextRequest("http://localhost/api/strategies/publish", {
                method: "POST",
                body: JSON.stringify({ ...publishPayload, visibility: "private" }),
            });
            const res = await publishStrategy(req);
            expect(res.status).toBe(200);

            expect(lastStrategyProfileUpsert.visibility).toBe("private");
            expect(lastTradeAnalysisUpdate).toEqual({ is_public: false });
        });
    });
});
