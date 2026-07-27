export type MolecularFormulaPart =
  | { kind: "text"; value: string }
  | { kind: "sub"; value: string };

/**
 * Splits a plain molecular formula (e.g. `C221H342N46O68`) into text and
 * subscript digit runs so the UI can render standard chemical notation.
 */
export function molecularFormulaParts(formula: string): MolecularFormulaPart[] {
  const parts: MolecularFormulaPart[] = [];
  const pattern = /(\d+)|([^\d]+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(formula)) !== null) {
    if (match[1]) {
      parts.push({ kind: "sub", value: match[1] });
    } else if (match[2]) {
      parts.push({ kind: "text", value: match[2] });
    }
  }

  return parts;
}
