import type { EmailMessage, EmailProvider } from "./types";

// Default provider: logs the email instead of sending it. Lets the full
// checkout flow run without an email service configured.
export function createConsoleEmailProvider(): EmailProvider {
  return {
    name: "console",
    async send(message: EmailMessage): Promise<void> {
      console.info(
        `[email:console] To: ${message.to}\nSubject: ${message.subject}\n${message.text}`,
      );
    },
  };
}
