export const trackEvent = async (
  event_name: string,
  metadata: any = {}
) => {
  try {
    console.log(`[trackEvent] ${event_name}`, JSON.stringify(metadata));
    await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name,
        metadata,
      }),
    });
  } catch (e) {
    console.log("track error", e);
  }
};
