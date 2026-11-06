import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { leftBudget } from "./finance";

describe("left budget", () => {
  test("is planned minus spent", () => {
    strictEqual(leftBudget(15503.08, 0), 15503.08);
    strictEqual(leftBudget(1000, 250.5), 749.5);
  });
  test("goes negative when spending passes the plan", () => {
    strictEqual(leftBudget(100, 120), -20);
  });
});
