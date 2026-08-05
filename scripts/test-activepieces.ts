/**
 * Local Activepieces connection test (does not touch orders/checkout).
 *
 * Usage (from web/):
 *   MARKETING_AUTOMATION_ENABLED=true \
 *   ACTIVEPIECES_WEBHOOK_URL=https://… \
 *   ACTIVEPIECES_WEBHOOK_SECRET=… \
 *   npm run test:activepieces
 */
import { sendActivepiecesEvent } from "../src/lib/integrations/activepieces";

async function main(): Promise<void> {
  const occurredAt = new Date().toISOString();
  const eventId = `connection-test-${Date.now()}`;

  const result = await sendActivepiecesEvent({
    eventId,
    eventType: "connection.test",
    occurredAt,
    payload: {
      source: "eph",
      environment: "local",
      message: "EPH server connection test",
    },
  });

  if (result.skipped) {
    console.log(
      "Activepieces send skipped (MARKETING_AUTOMATION_ENABLED is not \"true\").",
    );
    console.log(
      "Set MARKETING_AUTOMATION_ENABLED=true plus ACTIVEPIECES_WEBHOOK_URL and ACTIVEPIECES_WEBHOOK_SECRET to exercise the webhook.",
    );
    return;
  }

  console.log(
    `Activepieces connection test succeeded (eventId=${result.eventId}, status=${result.status}).`,
  );
}

main().catch((error: unknown) => {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : String(error);
  // Intentionally log only safe fields — never dump env or full error objects
  // that might echo configuration values from surrounding tooling.
  console.error(`${name}: ${message}`);
  process.exitCode = 1;
});
