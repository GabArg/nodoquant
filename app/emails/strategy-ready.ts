interface StrategyReadyEmailProps {
    name: string;
    reportUrl: string;
}

export function strategyReadyEmail({ name, reportUrl }: StrategyReadyEmailProps): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your strategy results are ready</title>
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#6b7280;text-transform:uppercase;">NodoQuant</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#111111;line-height:1.3;">
                Your strategy has been analyzed 📊
              </h1>
              <p style="margin:0 0 8px 0;font-size:15px;color:#111111;line-height:1.6;">
                Hi ${name},
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#333333;line-height:1.6;">
                Your trading strategy has been processed successfully.
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;color:#333333;line-height:1.6;">
                We've analyzed your performance, risk profile, and statistical edge.
              </p>
              <p style="margin:0 0 28px 0;font-size:15px;font-weight:600;color:#111111;line-height:1.6;">
                Your results are ready.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${reportUrl}"
                       target="_blank"
                       style="display:inline-block;background-color:#000000;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;margin-top:4px;letter-spacing:-0.01em;">
                      View Your Report →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Conversion Section -->
          <tr>
            <td style="padding:36px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px 20px;background-color:#f9fafb;border-radius:8px;border-left:3px solid #e5e7eb;">
                    <p style="margin:0 0 6px 0;font-size:14px;color:#374151;line-height:1.5;font-style:italic;">
                      "Most traders lose money because they don't measure their edge.
                    </p>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;font-style:italic;">
                      Now you know yours."
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 32px 32px 32px;">
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px 0;" />
              <p style="margin:0 0 4px 0;font-size:12px;color:#9ca3af;line-height:1.5;">
                NodoQuant — Strategy Intelligence Platform for Traders
              </p>
              <p style="margin:0;font-size:12px;color:#d1d5db;line-height:1.5;">
                You're receiving this because you analyzed a strategy on NodoQuant.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
