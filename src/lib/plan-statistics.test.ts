import { describe, test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { monthlyPlanStatistics } from "./plan-statistics";

describe("monthly plan statistics", () => {
  test("contains exactly 12 months including empty months", () => {
    const result = monthlyPlanStatistics([], 2026);
    deepStrictEqual(result.map((month) => month.month), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    strictEqual(result.every((month) => month.total === 0 && month.completionRate === 0), true);
  });
  test("counts plans by their scheduled month in the selected year only", () => {
    const result = monthlyPlanStatistics([
      { plan_date: "2026-01-01", status: "OPEN" },
      { plan_date: "2026-01-31", status: "DONE" },
      { plan_date: "2026-12-31", status: "NOT_DONE" },
      { plan_date: "2025-01-01", status: "DONE" },
      { plan_date: "2027-01-01", status: "DONE" },
    ], 2026);
    strictEqual(result[0]?.total, 2);
    strictEqual(result[11]?.total, 1);
    strictEqual(result.reduce((sum, month) => sum + month.total, 0), 3);
  });
  test("DONE percentage is DONE divided by all monthly plans", () => {
    const result = monthlyPlanStatistics([
      { plan_date: "2026-11-01", status: "DONE" },
      { plan_date: "2026-11-02", status: "OPEN" },
      { plan_date: "2026-11-03", status: "NOT_DONE" },
      { plan_date: "2026-12-01", status: "DONE" },
    ], 2026);
    strictEqual(result[10]?.completionRate, 33);
    strictEqual(result[11]?.completionRate, 100);
  });
  test("done count is only DONE plans in that month", () => {
    const result = monthlyPlanStatistics([
      { plan_date: "2026-11-01", status: "DONE" },
      { plan_date: "2026-11-02", status: "DONE" },
      { plan_date: "2026-11-03", status: "OPEN" },
      { plan_date: "2026-12-01", status: "NOT_DONE" },
    ], 2026);
    strictEqual(result[10]?.total, 3);
    strictEqual(result[10]?.done, 2);
    strictEqual(result[11]?.total, 1);
    strictEqual(result[11]?.done, 0);
  });
});