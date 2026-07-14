import { createConsoleEmailProvider } from "./console";
import { createResendEmailProvider } from "./resend";
import type { EmailProvider } from "./types";

export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
  switch (provider) {
    case "resend":
      return createResendEmailProvider();
    case "console":
      return createConsoleEmailProvider();
    default:
      throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`);
  }
}

export type { EmailMessage, EmailProvider } from "./types";
