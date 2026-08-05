import { NextResponse } from "next/server";
import {
  NewsletterWebhookConfigError,
  sendNewsletterToActivepieces,
} from "@/lib/newsletter/activepiecesWebhook";
import { parseNewsletterSubscribeRequest } from "@/lib/newsletter/parseRequest";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Homepage newsletter signup → Activepieces webhook
 * (ACTIVEPIECES_NEWSLETTER_WEBHOOK). Webhook URL is server-only.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "newsletterSubscribe",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.newsletterSubscribe,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseNewsletterSubscribeRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await sendNewsletterToActivepieces({
      email: parsed.value.email,
      firstName: parsed.value.firstName,
    });
    return NextResponse.json({
      success: true,
      data: { email: parsed.value.email },
      error: null,
    });
  } catch (error) {
    if (error instanceof NewsletterWebhookConfigError) {
      console.error("newsletter Activepieces webhook not configured", error);
      return NextResponse.json(
        {
          error:
            "Newsletter signup is not available right now. Please try again later or email support.",
        },
        { status: 503 },
      );
    }
    console.error("newsletter Activepieces webhook failed", error);
    return NextResponse.json(
      {
        error:
          "We couldn't complete your signup. Please try again.",
      },
      { status: 502 },
    );
  }
}
