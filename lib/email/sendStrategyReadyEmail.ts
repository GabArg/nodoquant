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
    const html = strategyReadyEmail({
        name,
        reportUrl,
    });

    const { error } = await resend.emails.send({
        from: "NodoQuant <hola@nodoquant.com>",
        to,
        subject: "Your strategy has a verdict ⚠️",
        html,
    });

    if (error) {
        console.error("[Email] Failed to send strategy-ready email:", error);

        throw new Error(
            error.message || "Failed to send strategy-ready email"
        );
    }
}
