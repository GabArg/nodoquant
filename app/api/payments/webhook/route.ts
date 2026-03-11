import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import crypto from "crypto";

const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "whsec_placeholder";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    try {
        const payload = await req.text();

        // Verify signature
        const hmac = crypto.createHmac("sha256", webhookSecret);
        const digest = Buffer.from(hmac.update(payload).digest("hex"), "utf8");
        const xSignature = Buffer.from(signature, "utf8");

        if (!crypto.timingSafeEqual(digest, xSignature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(payload);
        const eventName = event.meta.event_name;
        const customData = event.meta.custom_data;
        const userId = customData?.user_id;

        const supabase = getSupabaseServer();
        if (!supabase) return NextResponse.json({ error: "DB missing" }, { status: 500 });

        if (eventName === "subscription_created" || eventName === "subscription_updated") {
            if (userId) {
                // Determine status (active/past_due/etc)
                const lsStatus = event.data.attributes.status;

                let planType = "pro";
                if (lsStatus === "cancelled" || lsStatus === "expired" || lsStatus === "unpaid") {
                    planType = "free";
                }

                await supabase
                    .from("user_subscriptions")
                    .upsert({
                        user_id: userId,
                        // Could store Lemon Squeezy specific IDs here if added to schema:
                        // stripe_subscription_id: event.data.id, 
                        // stripe_customer_id: event.data.attributes.customer_id.toString(),
                        status: lsStatus,
                        plan_type: planType,
                        current_period_end: event.data.attributes.renews_at,
                    });

                console.log(`[Lemon Squeezy Webhook] Updated user ${userId} to status ${lsStatus}`);
            }
        } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
            if (userId) {
                await supabase
                    .from("user_subscriptions")
                    .upsert({
                        user_id: userId,
                        status: event.data.attributes.status,
                        plan_type: "free",
                        current_period_end: event.data.attributes.ends_at || new Date().toISOString(),
                    });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("Webhook handler error:", err);
        return NextResponse.json({ error: "Internal Error processing webhook" }, { status: 500 });
    }
}
