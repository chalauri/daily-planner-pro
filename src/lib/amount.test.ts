import { describe, test } from "node:test";
import { strictEqual, ok } from "node:assert";
import { cleanAmountInput, parseAmount } from "./amount";

describe("parseAmount", () => {
  test("accepts a dot as decimal separator", () => strictEqual(parseAmount("4.40"), 4.4));
  test("accepts a comma as decimal separator", () => strictEqual(parseAmount("4,40"), 4.4));
  test("rejects text", () => ok(Number.isNaN(parseAmount("abc"))));
});

describe("cleanAmountInput", () => {
  test("keeps only one separator", () => strictEqual(cleanAmountInput("4,4.0"), "4,40"));
});
