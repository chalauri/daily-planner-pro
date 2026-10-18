import { describe, expect, test } from "bun:test";
import { DEFAULT_EXPENSE_SORT, nextExpenseSort, sortExpenses, type ExpenseSortKey } from "./expense-sort";

const rows = [
  { name: "Zebra", planned: 21, spent: 10, year: 2026, month: 11 },
  { name: "Apple", planned: 100, spent: 90, year: 2027, month: 1 },
  { name: "Bread", planned: 9, spent: 12, year: 2026, month: 2 },
];
const names = (key: ExpenseSortKey, direction: "asc" | "desc" = "asc") => sortExpenses(rows, { key, direction }, (r) => r, "en").map((r) => r.name);

describe("expense ordering", () => {
  test("defaults to alphabetical category names", () => {
    expect(sortExpenses(rows, DEFAULT_EXPENSE_SORT, (r) => r, "en").map((r) => r.name)).toEqual(["Apple", "Bread", "Zebra"]);
    expect(rows.map((r) => r.name)).toEqual(["Zebra", "Apple", "Bread"]);
  });
  test.each([
    ["name", ["Apple", "Bread", "Zebra"]],
    ["month", ["Bread", "Zebra", "Apple"]],
    ["planned", ["Bread", "Zebra", "Apple"]],
    ["spent", ["Zebra", "Bread", "Apple"]],
    ["remaining", ["Bread", "Apple", "Zebra"]],
    ["progress", ["Zebra", "Apple", "Bread"]],
  ] as [ExpenseSortKey, string[]][]) ("sorts %s ascending and descending", (key, expected) => {
    expect(names(key)).toEqual(expected);
    expect(names(key, "desc")).toEqual([...expected].reverse());
  });
  test("repeat clicks reverse direction and a new column starts ascending", () => {
    expect(nextExpenseSort(DEFAULT_EXPENSE_SORT, "name")).toEqual({ key: "name", direction: "desc" });
    expect(nextExpenseSort({ key: "name", direction: "desc" }, "name")).toEqual(DEFAULT_EXPENSE_SORT);
    expect(nextExpenseSort(DEFAULT_EXPENSE_SORT, "spent")).toEqual({ key: "spent", direction: "asc" });
  });
});