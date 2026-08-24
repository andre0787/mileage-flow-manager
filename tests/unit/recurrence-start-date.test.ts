import { describe, expect, it } from "vitest";
import { calculateRecurrence } from "@/lib/recurrence";

describe("calculateRecurrence startDate", () => {
  it("usa startDate como base do dia e do fim da recorrência", () => {
    const result = calculateRecurrence({
      date: "2025-01-10",
      startDate: "2025-01-31",
      isClube: false,
      clubeMeses: "",
      isRecurrent: true,
      recurrenceCount: 2,
      recurrenceType: "monthly",
      recurrenceValueMode: "repeat",
    });

    expect(result.recurrenceDayOfMonth).toBe(31);
    expect(result.recurrenceEnd).toBe("2025-03-31");
  });

  it("usa startDate no modo Clube em vez da data atual", () => {
    const result = calculateRecurrence({
      date: "2025-01-10",
      startDate: "2025-01-31",
      isClube: true,
      clubeMeses: "1",
      isRecurrent: false,
      recurrenceCount: 1,
      recurrenceType: "monthly",
      recurrenceValueMode: "repeat",
    });

    expect(result.recurrenceEnd).toBe("2025-02-28");
  });
});
