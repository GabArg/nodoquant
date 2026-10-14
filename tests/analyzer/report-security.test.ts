import { describe, expect, it } from "vitest";
import {
    canAccessReport,
    canAccessStrategyProfile,
    isStrategyProfileIndexable,
} from "@/lib/auth/reportAccess";

/**
 * Suite de Pruebas de Regresión de Seguridad:
 * Control de acceso y privacidad para reportes, certificados y metadatos.
 */
describe("Report & Certificate Access Security (canAccessReport)", () => {
    const ownerId = "user-owner-uuid-1234";
    const thirdPartyId = "user-thirdparty-uuid-5678";

    const publicUserReport = {
        id: "rep-pub-1",
        public_id: "pub_slug_1",
        user_id: ownerId,
        is_public: true,
        trades_count: 142,
        winrate: 65.5,
        metrics_json: { strategy_score: 82, total_trades: 142 },
    };

    const privateUserReport = {
        id: "rep-priv-1",
        public_id: "priv_slug_1",
        user_id: ownerId,
        is_public: false,
        trades_count: 210,
        winrate: 58.2,
        metrics_json: { strategy_score: 74, total_trades: 210 },
    };

    const anonymousPrivateReport = {
        id: "rep-anon-priv",
        public_id: null,
        user_id: null,
        is_public: false,
        trades_count: 50,
        winrate: 51.0,
        metrics_json: { strategy_score: 45, total_trades: 50 },
    };

    const anonymousPublicReport = {
        id: "rep-anon-pub",
        public_id: "anon_pub_slug",
        user_id: null,
        is_public: true,
        trades_count: 85,
        winrate: 61.0,
        metrics_json: { strategy_score: 70, total_trades: 85 },
    };

    // 1. Reporte público
    describe("1. Acceso a reporte público", () => {
        it("permite el acceso a un visitante anónimo (userId null o undefined)", () => {
            expect(canAccessReport(publicUserReport, null)).toBe(true);
            expect(canAccessReport(publicUserReport, undefined)).toBe(true);
        });

        it("permite el acceso a un usuario autenticado tercero", () => {
            expect(canAccessReport(publicUserReport, thirdPartyId)).toBe(true);
        });

        it("permite el acceso al propietario del reporte", () => {
            expect(canAccessReport(publicUserReport, ownerId)).toBe(true);
        });

        it("permite el acceso a reportes anónimos si fueron explícitamente publicados", () => {
            expect(canAccessReport(anonymousPublicReport, null)).toBe(true);
            expect(canAccessReport(anonymousPublicReport, thirdPartyId)).toBe(true);
        });
    });

    // 2. Reporte privado del propietario
    describe("2. Acceso a reporte privado del propietario", () => {
        it("permite el acceso al propietario autenticado", () => {
            expect(canAccessReport(privateUserReport, ownerId)).toBe(true);
        });

        it("permite el acceso al propietario incluso si is_public es undefined o null", () => {
            const reportNullPublic = { ...privateUserReport, is_public: null };
            const reportUndefinedPublic = { ...privateUserReport, is_public: undefined };
            expect(canAccessReport(reportNullPublic, ownerId)).toBe(true);
            expect(canAccessReport(reportUndefinedPublic, ownerId)).toBe(true);
        });
    });

    // 3. Reporte privado solicitado por un tercero
    describe("3. Reporte privado solicitado por un tercero autenticado", () => {
        it("deniega estrictamente el acceso a cualquier usuario que no sea el propietario", () => {
            expect(canAccessReport(privateUserReport, thirdPartyId)).toBe(false);
            expect(canAccessReport(privateUserReport, "another-random-user")).toBe(false);
        });
    });

    // 4. Acceso anónimo a reporte privado
    describe("4. Acceso anónimo a reporte privado", () => {
        it("deniega el acceso de un visitante anónimo a un reporte privado de usuario", () => {
            expect(canAccessReport(privateUserReport, null)).toBe(false);
            expect(canAccessReport(privateUserReport, undefined)).toBe(false);
        });

        it("deniega el acceso de un visitante anónimo a un reporte huérfano/anónimo no publicado", () => {
            expect(canAccessReport(anonymousPrivateReport, null)).toBe(false);
            expect(canAccessReport(anonymousPrivateReport, undefined)).toBe(false);
        });

        it("deniega el acceso de un tercero autenticado a un reporte huérfano/anónimo no publicado", () => {
            expect(canAccessReport(anonymousPrivateReport, thirdPartyId)).toBe(false);
        });
    });

    // 5. Identificador inexistente o nulo
    describe("5. Identificador inexistente o registro nulo", () => {
        it("retorna false cuando el reporte no existe (null o undefined)", () => {
            expect(canAccessReport(null, ownerId)).toBe(false);
            expect(canAccessReport(undefined, ownerId)).toBe(false);
            expect(canAccessReport(null, null)).toBe(false);
        });

        it("valida formato de identificadores para prevenir inyecciones y caracteres inválidos", () => {
            const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

            // Válidos
            expect(SAFE_ID_REGEX.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
            expect(SAFE_ID_REGEX.test("strat_alpha_123")).toBe(true);
            expect(SAFE_ID_REGEX.test("public123")).toBe(true);

            // Inválidos / vectores de inyección
            expect(SAFE_ID_REGEX.test("")).toBe(false);
            expect(SAFE_ID_REGEX.test("../secrets")).toBe(false);
            expect(SAFE_ID_REGEX.test("id' OR 1=1--")).toBe(false);
            expect(SAFE_ID_REGEX.test("rep; DROP TABLE trade_analysis;")).toBe(false);
            expect(SAFE_ID_REGEX.test("<script>alert(1)</script>")).toBe(false);
            expect(SAFE_ID_REGEX.test("id with spaces")).toBe(false);
        });
    });

    // 6. Metadatos de un reporte privado
    describe("6. Metadatos de reporte privado y prevención de filtraciones", () => {
        interface MockMetadataResult {
            title: string;
            description?: string;
            robots?: { index: boolean; follow: boolean };
            openGraph?: { images?: string[]; title?: string };
        }

        function simulateReportMetadata(
            report: { is_public?: boolean | null; user_id?: string | null; trades_count?: number; metrics_json?: any } | null,
            viewerUserId?: string | null
        ): MockMetadataResult {
            if (!report || !canAccessReport(report, viewerUserId)) {
                return {
                    title: "Reporte no encontrado — NodoQuant",
                    description: "El reporte solicitado no existe o no está disponible públicamente.",
                    robots: { index: false, follow: false },
                };
            }

            const metrics = report.metrics_json ?? {};
            const score = metrics.strategy_score ?? 0;
            return {
                title: `This strategy scores ${score}/100 — Is it actually profitable?`,
                description: `Quantitative analysis of ${report.trades_count} trades.`,
            };
        }

        function simulateCertificateMetadata(
            report: { is_public?: boolean | null; user_id?: string | null; metrics_json?: any; id?: string } | null,
            viewerUserId?: string | null
        ): MockMetadataResult {
            if (!report || !canAccessReport(report, viewerUserId)) {
                return {
                    title: "Certificate Not Found — NodoQuant",
                    description: "The requested certificate does not exist or is private.",
                    robots: { index: false, follow: false },
                };
            }

            const metrics = report.metrics_json ?? {};
            const score = metrics.strategy_score ?? 0;
            return {
                title: `Strategy Score: ${score} — NodoQuant Certified`,
                description: `Verified trading strategy analysis with a score of ${score}/100.`,
                openGraph: {
                    images: [`/api/og/certificate?id=${report.id}`],
                },
            };
        }

        it("un visitante anónimo recibe robots: noindex/nofollow y ningún dato privado en el reporte", () => {
            const meta = simulateReportMetadata(privateUserReport, null);
            expect(meta.title).toBe("Reporte no encontrado — NodoQuant");
            expect(meta.description).not.toContain("210 trades");
            expect(meta.description).not.toContain("74");
            expect(meta.robots).toEqual({ index: false, follow: false });
        });

        it("un tercero autenticado recibe robots: noindex/nofollow y ningún dato en el certificado", () => {
            const meta = simulateCertificateMetadata(privateUserReport, thirdPartyId);
            expect(meta.title).toBe("Certificate Not Found — NodoQuant");
            expect(meta.description).toBe("The requested certificate does not exist or is private.");
            expect(meta.openGraph?.images).toBeUndefined();
            expect(meta.robots).toEqual({ index: false, follow: false });
        });

        it("el propietario autenticado sí puede ver los metadatos de su reporte privado", () => {
            const meta = simulateReportMetadata(privateUserReport, ownerId);
            expect(meta.title).toContain("scores 74/100");
            expect(meta.description).toContain("210 trades");
            expect(meta.robots).toBeUndefined();
        });

        it("los metadatos de un reporte público son accesibles por cualquiera", () => {
            const meta = simulateReportMetadata(publicUserReport, null);
            expect(meta.title).toContain("scores 82/100");
            expect(meta.description).toContain("142 trades");
            expect(meta.robots).toBeUndefined();
        });
    });

    // 7. Políticas de Caching HTTP
    describe("7. Cabeceras Cache-Control defensivas", () => {
        function getCacheControlHeader(isPublic: boolean | null | undefined): string {
            return isPublic
                ? "public, s-maxage=3600, stale-while-revalidate=86400"
                : "private, no-cache, no-store, must-revalidate";
        }

        it("asigna Cache-Control privado y no almacenable para reportes privados", () => {
            expect(getCacheControlHeader(false)).toBe("private, no-cache, no-store, must-revalidate");
            expect(getCacheControlHeader(null)).toBe("private, no-cache, no-store, must-revalidate");
            expect(getCacheControlHeader(undefined)).toBe("private, no-cache, no-store, must-revalidate");
        });

        it("asigna Cache-Control público solo para reportes explícitamente públicos", () => {
            expect(getCacheControlHeader(true)).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
        });
    });

    // 8. Perfiles de Estrategia: Visibilidad, Acceso e Indexación
    describe("8. Strategy Profiles Visibility (canAccessStrategyProfile & isStrategyProfileIndexable)", () => {
        const publicProfile = { user_id: ownerId, visibility: "public" };
        const unlistedProfile = { user_id: ownerId, visibility: "unlisted" };
        const privateProfile = { user_id: ownerId, visibility: "private" };

        it("permite acceso a perfil público para cualquiera y es indexable", () => {
            expect(canAccessStrategyProfile(publicProfile, null)).toBe(true);
            expect(canAccessStrategyProfile(publicProfile, thirdPartyId)).toBe(true);
            expect(canAccessStrategyProfile(publicProfile, ownerId)).toBe(true);
            expect(isStrategyProfileIndexable(publicProfile)).toBe(true);
        });

        it("permite acceso a perfil unlisted por enlace directo pero NO es indexable", () => {
            expect(canAccessStrategyProfile(unlistedProfile, null)).toBe(true);
            expect(canAccessStrategyProfile(unlistedProfile, thirdPartyId)).toBe(true);
            expect(canAccessStrategyProfile(unlistedProfile, ownerId)).toBe(true);
            expect(isStrategyProfileIndexable(unlistedProfile)).toBe(false);
        });

        it("deniega acceso a perfil privado a usuarios anónimos o terceros", () => {
            expect(canAccessStrategyProfile(privateProfile, null)).toBe(false);
            expect(canAccessStrategyProfile(privateProfile, thirdPartyId)).toBe(false);
            expect(canAccessStrategyProfile(privateProfile, "random-user")).toBe(false);
            expect(isStrategyProfileIndexable(privateProfile)).toBe(false);
        });

        it("permite acceso a perfil privado únicamente a su propietario", () => {
            expect(canAccessStrategyProfile(privateProfile, ownerId)).toBe(true);
        });

        it("maneja registros nulos o sin visibilidad definida de forma segura", () => {
            expect(canAccessStrategyProfile(null, ownerId)).toBe(false);
            expect(canAccessStrategyProfile(undefined, ownerId)).toBe(false);
            // Default visibility fallback is 'public'
            expect(canAccessStrategyProfile({ user_id: ownerId, visibility: null }, null)).toBe(true);
            expect(isStrategyProfileIndexable(null)).toBe(false);
        });
    });
});

