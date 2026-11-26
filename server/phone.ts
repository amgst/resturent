/**
 * Turns a phone number into a comparable form, so different ways of writing
 * the same number match:  "0412 345 678", "+61 412 345 678", "61412345678"
 * all become "0412345678". Non-Australian numbers keep their digits.
 */
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0061")) digits = digits.slice(2);
  // Australian international format: 61 + 9-digit national number (without leading 0)
  if (digits.startsWith("61") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/** True when two numbers are the same, allowing for formatting and country-code differences. */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = normalizePhone(a);
  const y = normalizePhone(b);
  if (x.length < 6 || y.length < 6) return false;
  if (x === y) return true;
  // Fallback: same last 9 digits (covers other country codes and trunk prefixes).
  return x.length >= 9 && y.length >= 9 && x.slice(-9) === y.slice(-9);
}
