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

        const { data, error } = await resend.emails.send({
            from: "NodoQuant <hola@nodoquant.com>",
            to,
            subject: "Your strategy has a verdict ⚠️",
            html,
        });

        if (error) {
            console.error("EMAIL ERROR:", error);
        } else {
            console.log("EMAIL SENT:", data?.id);
            console.log("EMAIL TO:", to);
        }
    } catch (err) {
        // Never throw — email is non-critical; does not break the save flow
        console.error("EMAIL ERROR:", err);
    }
}
