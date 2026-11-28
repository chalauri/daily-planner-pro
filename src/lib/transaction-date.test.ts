import { test } from "node:test";
import { strictEqual } from "node:assert";
import { defaultTransactionDate } from "./transaction-date";

test("new transactions default to the current local date, not the first of the month", () => {
  strictEqual(defaultTransactionDate(new Date(2026, 10, 28, 9, 41)), "2026-11-28");
  strictEqual(defaultTransactionDate(new Date(2027, 0, 1, 0, 5)), "2027-01-01");
});