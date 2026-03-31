import { Resend } from "resend";
import { strategyReadyEmail } from "@/app/emails/strategy-ready";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendStrategyReadyEmailProps {
    to: string;
    name: string;
    reportUrl: string;
}

export async function sendStrategyReadyEmail({
    to,
    name,
    reportUrl,
}: SendStrategyReadyEmailProps): Promise<void> {
    try {
        const html = strategyReadyEmail({ name, reportUrl });

        const { error } = await resend.emails.send({
            from: "NodoQuant <hola@nodoquant.com>",
            to,
            subject: "Your strategy results are ready 📊",
            html,
        });

        if (error) {
            console.error("[Email] Failed to send strategy-ready email:", error);
        } else {
            console.log("[Email] strategy-ready sent to:", to);
        }
    } catch (err) {
        // Never throw — email is non-critical; don't break the save flow
        console.error("[Email] Unexpected error sending strategy-ready email:", err);
    }
}
