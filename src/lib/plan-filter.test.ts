import { afterEach, describe, expect, it } from "vitest";
import {
  buildOverdueFilter,
  consumePendingPlanFilter,
  previousDayISO,
  requestPlanFilter,
  subscribePlanFilter,
} from "./plan-filter";

afterEach(() => {
  // A leftover pending request would leak into the next test.
  consumePendingPlanFilter();
});

describe("plan filter requests", () => {
  it("hands a requested filter to the mounted Plans page", () => {
    const seen: string[] = [];
    const stop = subscribePlanFilter((request) => seen.push(request.status ?? "none"));

    requestPlanFilter({ status: "OPEN" });

    expect(seen).toEqual(["OPEN"]);
    stop();
  });

  it("keeps a requested filter until the Plans page picks it up once", () => {
    requestPlanFilter({ from: "2026-10-01", to: "2026-11-05", status: "OPEN" });

    expect(consumePendingPlanFilter()).toEqual({
      from: "2026-10-01",
      to: "2026-11-05",
      status: "OPEN",
    });
    expect(consumePendingPlanFilter()).toBeNull();
  });

  it("stops delivering after the Plans page unmounts", () => {
    let hits = 0;
    const stop = subscribePlanFilter(() => {
      hits += 1;
    });
    stop();

    requestPlanFilter({ status: "DONE" });

    expect(hits).toBe(0);
  });
});

describe("overdue filter", () => {
  it("shows only open plans from earlier days", () => {
    const filter = buildOverdueFilter(["2026-11-03", "2026-10-29", "2026-11-05"], "2026-11-06");

    expect(filter).toEqual({
      from: "2026-10-29",
      to: "2026-11-05",
      status: "OPEN",
      text: "",
    });
  });

  it("ignores plans dated today or later", () => {
    const filter = buildOverdueFilter(["2026-11-06", "2026-11-09"], "2026-11-06");

    expect(filter.from).toBe("2026-11-05");
    expect(filter.to).toBe("2026-11-05");
  });

  it("steps back a whole day across a month and year edge", () => {
    expect(previousDayISO("2026-11-01")).toBe("2026-10-31");
    expect(previousDayISO("2026-01-01")).toBe("2025-12-31");
  });
});
