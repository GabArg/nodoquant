import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
    try {
        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const lsApiKey = process.env.LEMON_SQUEEZY_API_KEY;
        const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
        const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

        if (!lsApiKey || !storeId || !variantId) {
            console.error("[Checkout] Missing Lemon Squeezy env vars");
            return NextResponse.json({ error: "Payment provider not configured." }, { status: 500 });
        }

        // Get origin for redirect URLs
        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

        const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${lsApiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.api+json",
            },
            body: JSON.stringify({
                data: {
                    type: "checkouts",
                    attributes: {
                        checkout_data: {
                            custom: {
                                user_id: user.id
                            }
                        },
                        product_options: {
                            redirect_url: `${origin}/billing/success`,
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: "stores",
                                id: storeId
                            }
                        },
                        variant: {
                            data: {
                                type: "variants",
                                id: variantId
                            }
                        }
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Checkout] Lemon Squeezy API error:", errorText);
            return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
        }

        const responseData = await response.json();
        const checkoutUrl = responseData?.data?.attributes?.url;

        if (!checkoutUrl) {
            console.error("[Checkout] No URL in response:", JSON.stringify(responseData));
            return NextResponse.json({ error: "No checkout URL returned." }, { status: 500 });
        }

        return NextResponse.json({ checkout_url: checkoutUrl });

    } catch (err: any) {
        console.error("[Checkout] Error:", err);
        return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
    }
}
