/** Normalizes a local Egyptian number ("01280550333") to E.164 ("+201280550333"). Leaves already-international numbers as-is. */
export function toE164Egypt(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("20")) return `+${digits}`;
  if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
  return `+20${digits}`;
}
