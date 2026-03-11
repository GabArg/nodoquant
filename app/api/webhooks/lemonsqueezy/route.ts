import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import crypto from "crypto";

const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

function verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    // Read raw body for signature verification
    const payload = await req.text();
    const signature = req.headers.get("x-signature") || "";

    // Verify signature
    if (!webhookSecret) {
        console.error("[LS Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set");
        return new Response(JSON.stringify({ error: "Not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    if (!signature || !verifySignature(payload, signature, webhookSecret)) {
        console.error("[LS Webhook] Invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    let event: any;
    try {
        event = JSON.parse(payload);
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    const eventName: string = event?.meta?.event_name;
    // custom data is in meta.custom_data
    const userId: string | undefined = event?.meta?.custom_data?.user_id;
    const subscriptionId: string | undefined = event?.data?.id?.toString();
    const attributes = event?.data?.attributes ?? {};
    const periodEnd: string | null = attributes?.renews_at ?? attributes?.ends_at ?? null;

    const supabase = getSupabaseServer();
    if (!supabase) {
        return new Response(JSON.stringify({ error: "DB not available" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    console.log(`[LS Webhook] Event: ${eventName}, User: ${userId}, Sub: ${subscriptionId}`);

    try {
        switch (eventName) {
            // --- Activate subscription ---
            case "order_created":
            case "subscription_created":
            case "subscription_resumed":
            case "subscription_payment_success": {
                if (!userId) break;

                await supabase.from("subscriptions").upsert({
                    user_id: userId,
                    lemonsqueezy_subscription_id: subscriptionId ?? null,
                    status: "active",
                    plan: "pro",
                    current_period_end: periodEnd,
                }, { onConflict: "user_id" });

                // Update user_profiles plan
                await supabase.from("user_profiles").update({ plan: "pro" }).eq("id", userId);

                console.log(`[LS Webhook] Activated PRO for user ${userId}`);
                break;
            }

            // --- Update subscription period ---
            case "subscription_updated": {
                const status = attributes?.status;
                const isPro = status === "active" || status === "trialing";

                if (subscriptionId) {
                    await supabase.from("subscriptions").update({
                        status: status ?? "active",
                        plan: isPro ? "pro" : "free",
                        current_period_end: periodEnd,
                    }).eq("lemonsqueezy_subscription_id", subscriptionId);
                }

                if (userId) {
                    await supabase.from("user_profiles").update({ plan: isPro ? "pro" : "free" }).eq("id", userId);
                }
                break;
            }

            // --- Cancel subscription ---
            case "subscription_cancelled":
            case "subscription_expired": {
                if (subscriptionId) {
                    await supabase.from("subscriptions").update({
                        status: "cancelled",
                        plan: "free",
                        current_period_end: periodEnd,
                    }).eq("lemonsqueezy_subscription_id", subscriptionId);
                }

                if (userId) {
                    await supabase.from("user_profiles").update({ plan: "free" }).eq("id", userId);
                    console.log(`[LS Webhook] Downgraded user ${userId} to Free`);
                }
                break;
            }

            default:
                console.log(`[LS Webhook] Unhandled event: ${eventName}`);
        }
    } catch (err: any) {
        console.error("[LS Webhook] Handler error:", err);
        return new Response(JSON.stringify({ error: "Handler error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
