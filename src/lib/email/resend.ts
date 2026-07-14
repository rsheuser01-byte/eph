import type { EmailMessage, EmailProvider } from "./types";

type ResendConfig = {
  apiKey: string;
  from: string;
};

function readConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY and EMAIL_FROM.",
    );
  }
  return { apiKey, from };
}

export function createResendEmailProvider(): EmailProvider {
  return {
    name: "resend",
    async send(message: EmailMessage): Promise<void> {
      const config = readConfig();
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Resend send failed (${response.status}): ${detail.slice(0, 300)}`,
        );
      }
    },
  };
}
