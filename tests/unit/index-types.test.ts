import { describe, expect, it } from "vitest";
import { serializeDescription, parseDescription } from "../../src/types/index";

describe("serializeDescription", () => {
  it("returns undefined when given empty options", () => {
    expect(serializeDescription({})).toBeUndefined();
  });

  it("returns undefined when entryStatus is confirmada and no other fields are set", () => {
    expect(serializeDescription({ entryStatus: "confirmada" })).toBeUndefined();
  });

  it("serializes cartAmount and cartCost when cartAmount > 0", () => {
    const result = serializeDescription({ cartAmount: 1000, cartCost: 50 });
    expect(result).toBeDefined();
    const parsed = JSON.parse(result!);
    expect(parsed).toEqual({ cartAmount: 1000, cartCost: 50 });
  });

  it("ignores cartAmount and cartCost when cartAmount is 0 or negative", () => {
    expect(serializeDescription({ cartAmount: 0, cartCost: 50 })).toBeUndefined();
    expect(serializeDescription({ cartAmount: -100, cartCost: 50 })).toBeUndefined();
  });

  it("includes entryStatus when it is aguardando", () => {
    const result = serializeDescription({ entryStatus: "aguardando" });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({ entryStatus: "aguardando" });
  });

  it("serializes parentEntryId when provided", () => {
    const result = serializeDescription({ parentEntryId: "entry-123" });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({ parentEntryId: "entry-123" });
  });

  it("serializes recurrence fields when provided", () => {
    const result = serializeDescription({
      recurrenceInterval: 30,
      recurrenceEnd: "2025-12-31",
      recurrenceValueMode: "split",
      recurrenceDayOfMonth: 15,
    });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({
      recurrenceInterval: 30,
      recurrenceEnd: "2025-12-31",
      recurrenceValueMode: "split",
      recurrenceDayOfMonth: 15,
    });
  });

  it("serializes all non-default fields together", () => {
    const result = serializeDescription({
      cartAmount: 500,
      cartCost: 25,
      entryStatus: "aguardando",
      parentEntryId: "parent-456",
      recurrenceInterval: 30,
      recurrenceEnd: "2026-06-30",
      recurrenceValueMode: "repeat",
      recurrenceDayOfMonth: 10,
    });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({
      cartAmount: 500,
      cartCost: 25,
      entryStatus: "aguardando",
      parentEntryId: "parent-456",
      recurrenceInterval: 30,
      recurrenceEnd: "2026-06-30",
      recurrenceValueMode: "repeat",
      recurrenceDayOfMonth: 10,
    });
  });
});

describe("parseDescription", () => {
  it("returns empty object for undefined, null, or empty string", () => {
    expect(parseDescription(undefined)).toEqual({});
    expect(parseDescription(null)).toEqual({});
    expect(parseDescription("")).toEqual({});
  });

  it("returns empty object for invalid JSON string", () => {
    expect(parseDescription("not a json string")).toEqual({});
    expect(parseDescription("{invalid-json")).toEqual({});
  });

  it("parses valid JSON string into description object", () => {
    const jsonStr = JSON.stringify({
      cartAmount: 2000,
      cartCost: 100,
      entryStatus: "aguardando",
      parentEntryId: "p-123",
    });
    const parsed = parseDescription(jsonStr);
    expect(parsed).toEqual({
      cartAmount: 2000,
      cartCost: 100,
      entryStatus: "aguardando",
      parentEntryId: "p-123",
    });
  });

  it("performs correct roundtrip serialization and parsing", () => {
    const input = {
      cartAmount: 1500,
      cartCost: 75,
      entryStatus: "aguardando" as const,
      parentEntryId: "parent-789",
      recurrenceInterval: 60,
      recurrenceEnd: "2025-08-01",
      recurrenceValueMode: "split" as const,
      recurrenceDayOfMonth: 1,
    };

    const serialized = serializeDescription(input);
    expect(serialized).toBeDefined();
    const parsed = parseDescription(serialized);
    expect(parsed).toEqual(input);
  });
});
