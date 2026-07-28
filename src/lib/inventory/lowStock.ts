import { site } from "@/data/site";
import { getEmailProvider } from "@/lib/email";
import { listInventory } from "@/lib/inventory";

const DEFAULT_THRESHOLD = 5;

/**
 * Email store operators when any SKU is at or below the threshold.
 * Call from a cron/job or after inventory adjustments.
 */
export async function sendLowStockAlerts(
  threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? DEFAULT_THRESHOLD),
): Promise<{ sent: boolean; skus: string[] }> {
  const rows = await listInventory();
  const low = rows.filter((row) => row.quantityAvailable <= threshold);
  if (low.length === 0) {
    return { sent: false, skus: [] };
  }

  const lines = low
    .map(
      (row) =>
        `- ${row.sku}: ${row.quantityAvailable} available (${row.quantityOnHand} on hand)`,
    )
    .join("\n");

  const email = getEmailProvider();
  await email.send({
    to: site.email,
    subject: `[${site.name}] Low stock alert (${low.length} SKU${low.length === 1 ? "" : "s"})`,
    text: `The following SKUs are at or below ${threshold} units:\n\n${lines}\n\nReview inventory at /admin/inventory.`,
    html: `<p>The following SKUs are at or below <strong>${threshold}</strong> units:</p><pre>${lines}</pre><p>Review inventory at <code>/admin/inventory</code>.</p>`,
  });

  return { sent: true, skus: low.map((row) => row.sku) };
}
