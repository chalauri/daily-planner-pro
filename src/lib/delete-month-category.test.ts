import { test } from "node:test";
import { deepStrictEqual, strictEqual, rejects } from "node:assert";
import { deleteMonthCategory } from "./delete-month-category";

function fixture(failTable?: string) {
  const tables: Record<string, Record<string, string | number>[]> = {
    categories: [{ id: "food" }],
    budgets: [
      { category_id: "food", year: 2026, month: 11 },
      { category_id: "food", year: 2026, month: 12 },
      { category_id: "food", year: 2027, month: 1 },
      { category_id: "rent", year: 2026, month: 12 },
    ],
    transactions: [
      { category_id: "food", period: "2026-11-01", tx_date: "2026-11-29" },
      { category_id: "food", period: "2026-12-01", tx_date: "2026-11-29" },
      { category_id: "food", period: "2027-01-01", tx_date: "2027-01-01" },
      { category_id: "rent", period: "2026-12-01", tx_date: "2026-12-02" },
    ],
  };
  const client = {
    from(table: string) {
      const filters: ((row: Record<string, string | number>) => boolean)[] = [];
      const query = {
        delete() { return query; },
        eq(key: string, value: string | number) { filters.push(row => row[key] === value); return query; },
        gte(key: string, value: string) { filters.push(row => row[key] >= value); return query; },
        lt(key: string, value: string) { filters.push(row => row[key] < value); return query; },
        then(resolve: (result: { error: Error | null }) => unknown) {
          if (table === failTable) return Promise.resolve(resolve({ error: new Error("Deletion failed") }));
          tables[table] = tables[table].filter(row => !filters.every(filter => filter(row)));
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return query;
    },
  } as unknown as Parameters<typeof deleteMonthCategory>[0];
  return { client, tables };
}

test("removing copied December expenses preserves November, January and other categories", async () => {
  const { client, tables } = fixture();
  await deleteMonthCategory(client, "food", { year: 2026, month: 12 });
  deepStrictEqual(tables.budgets.map(row => [row.category_id, row.month]), [["food", 11], ["food", 1], ["rent", 12]]);
  deepStrictEqual(tables.transactions.map(row => [row.category_id, row.period]), [["food", "2026-11-01"], ["food", "2027-01-01"], ["rent", "2026-12-01"]]);
  deepStrictEqual(tables.categories, [{ id: "food" }]);
});

test("transaction deletion errors stop budget removal", async () => {
  const { client, tables } = fixture("transactions");
  await rejects(deleteMonthCategory(client, "food", { year: 2026, month: 12 }), /Deletion failed/);
  strictEqual(tables.budgets.length, 4);
});

test("budget deletion errors are reported", async () => {
  const { client } = fixture("budgets");
  await rejects(deleteMonthCategory(client, "food", { year: 2026, month: 12 }), /Deletion failed/);
});