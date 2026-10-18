import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import { DEFAULT_EXPENSE_SORT, nextExpenseSort, sortExpenses, type ExpenseSortKey } from "./expense-sort";

const rows = [
  { name: "Zebra", planned: 21, spent: 10, year: 2026, month: 11 },
  { name: "Apple", planned: 100, spent: 90, year: 2027, month: 1 },
  { name: "Bread", planned: 9, spent: 12, year: 2026, month: 2 },
];
const names = (key: ExpenseSortKey, direction: "asc" | "desc" = "asc") => sortExpenses(rows, { key, direction }, (r) => r, "en").map((r) => r.name);

describe("expense ordering", () => {
  test("defaults to alphabetical category names", () => {
    deepStrictEqual(sortExpenses(rows, DEFAULT_EXPENSE_SORT, (r) => r, "en").map((r) => r.name), ["Apple", "Bread", "Zebra"]);
    deepStrictEqual(rows.map((r) => r.name), ["Zebra", "Apple", "Bread"]);
  });
  for (const [key, expected] of [
    ["name", ["Apple", "Bread", "Zebra"]],
    ["month", ["Bread", "Zebra", "Apple"]],
    ["planned", ["Bread", "Zebra", "Apple"]],
    ["spent", ["Zebra", "Bread", "Apple"]],
    ["remaining", ["Bread", "Apple", "Zebra"]],
    ["progress", ["Zebra", "Apple", "Bread"]],
  ] as [ExpenseSortKey, string[]][]) test(`sorts ${key} ascending and descending`, () => {
    deepStrictEqual(names(key), expected);
    deepStrictEqual(names(key, "desc"), [...expected].reverse());
  });
  test("repeat clicks reverse direction and a new column starts ascending", () => {
    deepStrictEqual(nextExpenseSort(DEFAULT_EXPENSE_SORT, "name"), { key: "name", direction: "desc" });
    deepStrictEqual(nextExpenseSort({ key: "name", direction: "desc" }, "name"), DEFAULT_EXPENSE_SORT);
    deepStrictEqual(nextExpenseSort(DEFAULT_EXPENSE_SORT, "spent"), { key: "spent", direction: "asc" });
  });
});