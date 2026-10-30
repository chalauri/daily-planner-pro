import { describe, expect, it } from "vitest";
import { cleanAmountInput, parseAmount } from "./amount";

describe("parseAmount", () => {
  it("accepts a dot as decimal separator", () => expect(parseAmount("4.40")).toBe(4.4));
  it("accepts a comma as decimal separator", () => expect(parseAmount("4,40")).toBe(4.4));
  it("rejects text", () => expect(parseAmount("abc")).toBeNaN());
});

describe("cleanAmountInput", () => {
  it("keeps only one separator", () => expect(cleanAmountInput("4,4.0")).toBe("4,40"));
});
