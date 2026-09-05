import { createClient } from "./auth/client";
import { getSupabaseServer } from "./supabase";

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
 * Tracks an analytics event.
 * Works on both client and server.
 */
export async function trackEvent(
    name: AnalyticsEvent,
    properties: EventProperties = {},
    userId?: string
): Promise<void> {
    try {
        const isServer = typeof window === "undefined";
        const supabase = isServer ? getSupabaseServer() : createClient();

        if (!supabase) return;

        const { error } = await supabase
            .from("analytics_events")
            .insert({
                event_name: name,
                properties,
                user_id: userId,
                url: isServer ? undefined : window.location.href,
                // Add simple session/fingerprint if available
                session_id: isServer
                    ? "server"
                    : localStorage.getItem("nq_session_id") || undefined,
            });

        if (error) {
            console.error("Analytics tracking error:", error);
        }
    } catch (error: unknown) {
        console.error("Analytics tracking exception:", error);
    }
}
