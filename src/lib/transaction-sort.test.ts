import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import {
  DEFAULT_TX_SORT,
  nextTxSort,
  sortTransactions,
  transactionSortValues,
  type TxSortKey,
} from "./transaction-sort";

const rows = [
  { id: "rent", tx_date: "2026-11-05", kind: "EXPENSE", amount: 1200, note: "monthly", category_id: "rent" },
  { id: "salary", tx_date: "2026-11-01", kind: "INCOME", amount: 3000, note: "october pay", category_id: "salary" },
  { id: "shop", tx_date: "2026-11-12", kind: "EXPENSE", amount: 45.5, note: null, category_id: null },
];
const catName = (id: string | null) => (id === "rent" ? "Rent" : id === "salary" ? "Salary" : "Unplanned");
const ids = (key: TxSortKey, direction: "asc" | "desc" = "asc") =>
  sortTransactions(rows, { key, direction }, (r) => transactionSortValues(r, catName), "en").map((r) => r.id);

describe("transaction ordering", () => {
  test("defaults to newest date first without changing the input", () => {
    deepStrictEqual(
      sortTransactions(rows, DEFAULT_TX_SORT, (r) => transactionSortValues(r, catName), "en").map((r) => r.id),
      ["shop", "rent", "salary"],
    );
    deepStrictEqual(rows.map((r) => r.id), ["rent", "salary", "shop"]);
  });
  for (const [key, expected] of [
    ["date", ["salary", "rent", "shop"]],
    ["category", ["rent", "salary", "shop"]],
    ["amount", ["rent", "shop", "salary"]],
    ["note", ["shop", "rent", "salary"]],
  ] as [TxSortKey, string[]][]) test(`sorts ${key} ascending and descending`, () => {
    deepStrictEqual(ids(key), expected);
    deepStrictEqual(ids(key, "desc"), [...expected].reverse());
  });
  test("income counts as positive and expense as negative when sorting amount", () => {
    deepStrictEqual(
      sortTransactions(rows, { key: "amount", direction: "asc" }, (r) => transactionSortValues(r, catName), "en")
        .map((r) => r.id),
      ["rent", "shop", "salary"],
    );
    deepStrictEqual(transactionSortValues(rows[0], catName), { date: "2026-11-05", category: "Rent", amount: -1200, note: "monthly" });
    deepStrictEqual(transactionSortValues(rows[1], catName), { date: "2026-11-01", category: "Salary", amount: 3000, note: "october pay" });
  });
  test("repeat clicks reverse direction and a new column starts ascending", () => {
    deepStrictEqual(nextTxSort(DEFAULT_TX_SORT, "date"), { key: "date", direction: "asc" });
    deepStrictEqual(nextTxSort({ key: "date", direction: "asc" }, "date"), DEFAULT_TX_SORT);
    deepStrictEqual(nextTxSort(DEFAULT_TX_SORT, "note"), { key: "note", direction: "asc" });
  });
});
