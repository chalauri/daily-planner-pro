import { format } from "date-fns";

/** New payments start on the local current day, independent of budget month. */
export function defaultTransactionDate(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}