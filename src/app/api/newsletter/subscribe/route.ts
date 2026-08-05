import { NextResponse } from "next/server";
import {
  NewsletterConfigError,
  subscribeToNewsletter,
} from "@/lib/newsletter/subscribe";
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
 * Homepage newsletter signup: create Resend contact + send welcome template.
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
    const result = await subscribeToNewsletter(parsed.value.email);
    return NextResponse.json({
      success: true,
      data: { email: result.email },
      error: null,
    });
  } catch (error) {
    if (error instanceof NewsletterConfigError) {
      console.error("newsletter subscribe not configured", error);
      return NextResponse.json(
        {
          error:
            "Newsletter signup is not available right now. Please try again later or email support.",
        },
        { status: 503 },
      );
    }
    console.error("newsletter subscribe failed", error);
    return NextResponse.json(
      {
        error:
          "Could not complete signup. Please try again or email support.",
      },
      { status: 502 },
    );
  }
}
