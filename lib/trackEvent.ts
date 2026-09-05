export type TrackEventMetadata = Record<string, unknown>;

export const trackEvent = async (
    eventName: string,
    metadata: TrackEventMetadata = {}
): Promise<void> => {
    try {
        await fetch("/api/track", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event_name: eventName,
                metadata,
            }),
        });
    } catch (error: unknown) {
        console.error("Track event request failed:", error);
    }
};
