import { trackEvent as sendTrackEvent } from "./trackEvent";

export type AnalyticsEvent =
    | "certificate_view"
    | "certificate_share"
    | "strategy_publish"
    | "analyzer_run"
    | "analysis_started"
    | "analysis_completed"
    | "pro_feature_lock_click"
    | "trial_started"
    | "trial_expired"
    | "upgrade_cta_click"
    | "page_view";

export type EventProperties = Record<string, unknown>;

/**
 * Tracks an analytics event cleanly via HTTP /api/track.
 * Decouples the client bundle from database credentials and server-only modules.
 */
export async function trackEvent(
    name: AnalyticsEvent,
    properties: EventProperties = {},
    userId?: string
): Promise<void> {
    try {
        const payload: Record<string, unknown> = {
            ...properties,
            user_id: userId,
        };

        if (typeof window !== "undefined") {
            payload.url = window.location.href;
            const sessionId = localStorage.getItem("nq_session_id");
            if (sessionId) {
                payload.session_id = sessionId;
            }
        }

        await sendTrackEvent(name, payload);
    } catch (error: unknown) {
        console.error("Analytics tracking exception:", error);
    }
}
