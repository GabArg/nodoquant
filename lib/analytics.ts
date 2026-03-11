import { createClient } from "./auth/client";
import { getSupabaseServer } from "./supabase";

export type AnalyticsEvent =
    | 'certificate_view'
    | 'certificate_share'
    | 'strategy_publish'
    | 'analyzer_run'
    | 'page_view';

export interface EventProperties {
    [key: string]: any;
}

/**
 * Tracks an analytics event.
 * Works on both client and server.
 */
export async function trackEvent(
    name: AnalyticsEvent,
    properties: EventProperties = {},
    userId?: string
) {
    try {
        const isServer = typeof window === 'undefined';
        const supabase = isServer ? getSupabaseServer() : createClient();

        if (!supabase) return;

        const { error } = await supabase
            .from('analytics_events')
            .insert({
                event_name: name,
                properties,
                user_id: userId,
                url: isServer ? undefined : window.location.href,
                // Add simple session/fingerprint if available
                session_id: isServer ? 'server' : localStorage.getItem('nq_session_id') || undefined
            });

        if (error) {
            console.error('Analytics tracking error:', error);
        }
    } catch (e) {
        console.error('Analytics tracking exception:', e);
    }
}
