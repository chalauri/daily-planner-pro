/** Parse a user-typed amount, accepting both "4.40" and "4,40". Returns NaN when invalid. */
export function parseAmount(input: string): number {
  const s = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return NaN;
  return Number(s);
}

/** Keep only characters that can form a decimal amount (digits and one "." or ","). */
export function cleanAmountInput(input: string): string {
  const s = input.replace(/[^\d.,]/g, "");
  const i = s.search(/[.,]/);
  if (i === -1) return s;
  return s.slice(0, i + 1) + s.slice(i + 1).replace(/[.,]/g, "");
}
