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
  test("is still fine just below 90%", () => {
    strictEqual(budgetState(1000, 899), "ok");
  });
  test("is over budget once spending passes the plan", () => {
    strictEqual(budgetState(1000, 1001), "over");
  });
});
