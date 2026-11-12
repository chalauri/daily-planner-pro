import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { leftBudget, budgetState } from "./finance";

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
