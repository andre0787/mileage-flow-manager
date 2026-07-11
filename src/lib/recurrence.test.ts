import { expect, test, describe } from "vitest";
import { calculateRecurrence } from "./recurrence";

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
    expect(typeof result.recurrenceEnd).toBe("string");
    const end = new Date(result.recurrenceEnd!);
    const start = new Date(form.date);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30 * 3, 0);
  });

  test("returns correct quarterly recurrence", () => {
    const form = {
      ...baseForm,
      isRecurrent: true,
      recurrenceCount: 2,
      recurrenceType: "quarterly",
    };
    const result = calculateRecurrence(form);
    expect(result).toHaveProperty("recurrenceInterval", 90);
    expect(typeof result.recurrenceEnd).toBe("string");
    const end = new Date(result.recurrenceEnd!);
    const start = new Date(form.date);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(90 * 2, 0);
  });

  test("falls back to clube recurrence when isRecurrent false", () => {
    const form = { ...baseForm, isRecurrent: false, isClube: true, clubeMeses: "6" };
    const result = calculateRecurrence(form);
    // delegate to buildMonthlyRecurrence which returns interval 30 and end date based on now
    expect(result).toHaveProperty("recurrenceInterval", 30);
    expect(typeof result.recurrenceEnd).toBe("string");
  });
});