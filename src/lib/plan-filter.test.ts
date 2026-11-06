import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, test } from "node:test";
import {
  buildOverdueFilter,
  consumePendingPlanFilter,
  previousDayISO,
  requestPlanFilter,
  subscribePlanFilter,
} from "./plan-filter";

describe("plan filter requests", () => {
  test("hands a requested filter to the mounted Plans page", () => {
    const seen: string[] = [];
    const stop = subscribePlanFilter((request) => seen.push(request.status ?? "none"));

    requestPlanFilter({ status: "OPEN" });

    deepStrictEqual(seen, ["OPEN"]);
    stop();
    consumePendingPlanFilter();
  });

  test("keeps a requested filter until the Plans page picks it up once", () => {
    requestPlanFilter({ from: "2026-10-01", to: "2026-11-05", status: "OPEN" });

    deepStrictEqual(consumePendingPlanFilter(), {
      from: "2026-10-01",
      to: "2026-11-05",
      status: "OPEN",
    });
    strictEqual(consumePendingPlanFilter(), null);
  });

  test("stops delivering after the Plans page unmounts", () => {
    let hits = 0;
    const stop = subscribePlanFilter(() => {
      hits += 1;
    });
    stop();

    requestPlanFilter({ status: "DONE" });

    strictEqual(hits, 0);
    consumePendingPlanFilter();
  });
});

describe("overdue filter", () => {
  test("shows only open plans from earlier days", () => {
    const filter = buildOverdueFilter(["2026-11-03", "2026-10-29", "2026-11-05"], "2026-11-06");

    deepStrictEqual(filter, {
      from: "2026-10-29",
      to: "2026-11-05",
      status: "OPEN",
      text: "",
    });
  });

  test("ignores plans dated today or later", () => {
    const filter = buildOverdueFilter(["2026-11-06", "2026-11-09"], "2026-11-06");

    strictEqual(filter.from, "2026-11-05");
    strictEqual(filter.to, "2026-11-05");
  });

  test("steps back a whole day across a month and year edge", () => {
    strictEqual(previousDayISO("2026-11-01"), "2026-10-31");
    strictEqual(previousDayISO("2026-01-01"), "2025-12-31");
  });
});
