import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import {
  budgetPercent,
  leftBudget,
  budgetState,
  buildCategoryRows,
  bulkTxNote,
  type Budget,
  type Category,
  type Transaction,
} from "./finance";

describe("left budget", () => {
  test("is planned minus spent", () => {
    strictEqual(leftBudget(15503.08, 0), 15503.08);
    strictEqual(leftBudget(1000, 250.5), 749.5);
  });
  test("goes negative when spending passes the plan", () => {
    strictEqual(leftBudget(100, 120), -20);
  });
});

describe("near limit", () => {
  test("starts at 90% of the plan", () => {
    strictEqual(budgetState(1000, 900), "near");
  });
  test("80% to just below 90% is the yellow step", () => {
    strictEqual(budgetState(1000, 800), "warn");
    strictEqual(budgetState(1000, 899), "warn");
  });
  test("is fine below 80%", () => {
    strictEqual(budgetState(1000, 799), "ok");
  });
  test("is over budget once spending passes the plan", () => {
    strictEqual(budgetState(1000, 1001), "over");
    strictEqual(budgetState(1000, 1000), "near");
  });
});

const cat: Category = {
  id: "c1",
  user_id: "u1",
  name: "Rent",
  kind: "EXPENSE",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const budget: Budget = {
  id: "b1",
  user_id: "u1",
  category_id: "c1",
  year: 2026,
  month: 11,
  amount: 1200,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  is_income_tax: false,
  is_utilities: false,
  is_subscription: false,
  is_locked: false,
  note: "flat 12, includes parking",
};

const tx: Transaction = {
  id: "t1",
  user_id: "u1",
  kind: "EXPENSE",
  category_id: "c1",
  amount: 1200,
  tx_date: "2026-11-05",
  note: null,
  receipt_path: null,
  series_id: null,
  recurrence: "NONE",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  is_income_tax: false,
  period: "2026-11-01",
};

describe("percent of plan spent", () => {
  test("keeps the real figure once spending passes the plan", () => {
    strictEqual(budgetPercent(1000, 1250), 125);
    strictEqual(budgetPercent(1200, 1300), 108);
  });
  test("is exactly 100 when spending equals the plan", () => {
    strictEqual(budgetPercent(1200, 1200), 100);
  });
  test("rounds to the nearest whole percent", () => {
    strictEqual(budgetPercent(300, 100), 33);
  });
  test("is 100 with spending but no plan, 0 with neither", () => {
    strictEqual(budgetPercent(0, 50), 100);
    strictEqual(budgetPercent(0, 0), 0);
  });
});

describe("planned comment", () => {
  test("shows the comment written for that month's plan", () => {
    strictEqual(buildCategoryRows([cat], [budget], [tx])[0]?.note, "flat 12, includes parking");
  });
  test("is absent when the month has no plan of its own", () => {
    strictEqual(buildCategoryRows([cat], [], [tx])[0]?.note, null);
  });
});

describe("bulk upload comment", () => {
  test("keeps the marker alone when nothing is typed", () => {
    strictEqual(bulkTxNote("   "), "BULK UPLOAD");
  });
  test("adds the typed comment to the marker", () => {
    strictEqual(bulkTxNote("  shop run  "), "BULK UPLOAD · shop run");
  });
});
