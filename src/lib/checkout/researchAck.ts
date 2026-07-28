/**
 * Server-side research-use acknowledgment gate.
 * Client checkboxes alone are not sufficient for underwriting / compliance.
 */
export function researchUseAckError(
  body: Record<string, unknown>,
): string | null {
  if (body.researchUseAcknowledged === true) {
    return null;
  }
  return "Research-use-only acknowledgment is required.";
}
