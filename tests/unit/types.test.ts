import { describe, expect, it } from "vitest";
import { parseDescription, serializeDescription } from "@/types";

describe("parseDescription", () => {
  it("returns empty object when description is undefined or null", () => {
    expect(parseDescription(undefined)).toEqual({});
    expect(parseDescription(null)).toEqual({});
  });

  it("returns empty object when description is an empty string or whitespace", () => {
    expect(parseDescription("")).toEqual({});
    expect(parseDescription("   ")).toEqual({});
  });

  it("returns empty object when description is not valid JSON", () => {
    expect(parseDescription("not a json string")).toEqual({});
    expect(parseDescription("{ invalid json: 123 }")).toEqual({});
  });

  it("parses valid JSON string with complete entry description properties", () => {
    const input = JSON.stringify({
      cartAmount: 1000,
      cartCost: 50,
      entryStatus: "aguardando",
      parentEntryId: "entry-123",
      recurrenceInterval: 30,
      recurrenceEnd: "2025-12-31",
      recurrenceValueMode: "split",
      recurrenceDayOfMonth: 15,
    });

    const result = parseDescription(input);

    expect(result).toEqual({
      cartAmount: 1000,
      cartCost: 50,
      entryStatus: "aguardando",
      parentEntryId: "entry-123",
      recurrenceInterval: 30,
      recurrenceEnd: "2025-12-31",
      recurrenceValueMode: "split",
      recurrenceDayOfMonth: 15,
    });
  });

  it("parses valid JSON string with partial entry description properties", () => {
    const input = JSON.stringify({
      cartAmount: 500,
      cartCost: 25,
    });

    const result = parseDescription(input);

    expect(result).toEqual({
      cartAmount: 500,
      cartCost: 25,
    });
  });

  it("returns empty object for valid JSON representing empty object {}", () => {
    expect(parseDescription("{}")).toEqual({});
  });
});

describe("serializeDescription", () => {
  it("returns undefined when no option is provided or options are empty/default", () => {
    expect(serializeDescription({})).toBeUndefined();
    expect(serializeDescription({ entryStatus: "confirmada" })).toBeUndefined();
  });

  it("serializes cartAmount and cartCost when cartAmount > 0", () => {
    const result = serializeDescription({ cartAmount: 100, cartCost: 10 });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({ cartAmount: 100, cartCost: 10 });
  });

  it("serializes non-confirmada entryStatus", () => {
    const result = serializeDescription({ entryStatus: "aguardando" });
    expect(result).toBeDefined();
    expect(JSON.parse(result!)).toEqual({ entryStatus: "aguardando" });
  });

  it("serializes recurrence fields correctly", () => {
    const opts = {
      parentEntryId: "parent-456",
      recurrenceInterval: 15,
      recurrenceEnd: "2026-01-01",
      recurrenceValueMode: "repeat" as const,
      recurrenceDayOfMonth: 1,
    };
    const serialized = serializeDescription(opts);
    expect(serialized).toBeDefined();
    expect(JSON.parse(serialized!)).toEqual(opts);
  });

  it("performs round-trip serialization and parsing accurately", () => {
    const opts = {
      cartAmount: 2000,
      cartCost: 100,
      entryStatus: "aguardando" as const,
      parentEntryId: "p-1",
      recurrenceInterval: 30,
      recurrenceEnd: "2025-06-30",
      recurrenceValueMode: "split" as const,
      recurrenceDayOfMonth: 10,
    };

    const serialized = serializeDescription(opts);
    expect(serialized).toBeDefined();
    const parsed = parseDescription(serialized);
    expect(parsed).toEqual(opts);
  });
});
