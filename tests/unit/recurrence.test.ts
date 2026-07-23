import { expect, test, describe } from "vitest";
import { calculateRecurrence } from "../../src/lib/recurrence";

describe("calculateRecurrence", () => {
  const baseForm = {
    date: "2025-01-01",
    isClube: false,
    clubeMeses: "",
  };

  test("returns empty object when recurrence not enabled", () => {
    const form = { ...baseForm, isRecurrent: false };
    expect(calculateRecurrence(form)).toEqual({});
  });

  test("returns empty object when recurrenceCount < 2", () => {
    const form = { ...baseForm, isRecurrent: true, recurrenceCount: 1, recurrenceType: "monthly" };
    expect(calculateRecurrence(form)).toEqual({});
  });

  test("returns correct monthly recurrence", () => {
    const form = {
      ...baseForm,
      isRecurrent: true,
      recurrenceCount: 3,
      recurrenceType: "monthly",
    };
    const result = calculateRecurrence(form);
    expect(result).toHaveProperty("recurrenceInterval", 30);
    const start = new Date(form.date);
    const dayOfMonth = start.getUTCDate();
    expect(result).toHaveProperty("recurrenceDayOfMonth", dayOfMonth);
    expect(typeof result.recurrenceEnd).toBe("string");
    const end = new Date(result.recurrenceEnd!);
    // 3 meses (Jan 1 → Apr 1 UTC)
    expect(end.getUTCMonth()).toBe((start.getUTCMonth() + 3) % 12);
    expect(end.getUTCDate()).toBe(dayOfMonth);
  });

  test("returns correct quarterly recurrence", () => {
    const form = {
      ...baseForm,
      isRecurrent: true,
      recurrenceCount: 2,
      recurrenceType: "quarterly",
    };
    const result = calculateRecurrence(form);
    // ponytail: recurrenceInterval é sempre 30 para compatibilidade legada
    expect(result).toHaveProperty("recurrenceInterval", 30);
    const start = new Date(form.date);
    const dayOfMonth = start.getUTCDate();
    expect(result).toHaveProperty("recurrenceDayOfMonth", dayOfMonth);
    expect(typeof result.recurrenceEnd).toBe("string");
    const end = new Date(result.recurrenceEnd!);
    // 2 trimestres = 6 meses (Jan 1 → Jul 1 UTC)
    expect(end.getUTCMonth()).toBe((start.getUTCMonth() + 6) % 12);
    expect(end.getUTCDate()).toBe(dayOfMonth);
  });

  test("falls back to clube recurrence when isRecurrent false", () => {
    const form = {
      ...baseForm,
      isRecurrent: false,
      isClube: true,
      clubeMeses: "6",
    };
    const result = calculateRecurrence(form);
    expect(result).toHaveProperty("recurrenceInterval", 30);
    expect(typeof result.recurrenceEnd).toBe("string");
    // Clube usa setUTCMonth: 6 meses a partir de hoje
    const end = new Date(result.recurrenceEnd!);
    const start = new Date();
    const diffMonths =
      (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      end.getUTCMonth() -
      start.getUTCMonth();
    expect(diffMonths).toBe(6);
  });
});