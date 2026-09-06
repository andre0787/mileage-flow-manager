import { describe, it, expect } from "vitest";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";

describe("todayISODate", () => {
  it("retorna hoje em YYYY-MM-DD por padrão", () => {
    expect(todayISODate()).toBe(new Date().toISOString().split("T")[0]);
  });
});

describe("isValidISODate", () => {
  it("aceita data customizada válida (vai ao payload)", () => {
    expect(isValidISODate("2026-01-15")).toBe(true);
  });

  it("rejeita vazio, texto e formatos inválidos", () => {
    expect(isValidISODate("")).toBe(false);
    expect(isValidISODate("abc")).toBe(false);
    expect(isValidISODate("15/01/2026")).toBe(false);
    expect(isValidISODate(null)).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
  });

  it("rejeita dia inexistente no calendário", () => {
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("2026-02-30")).toBe(false);
  });
});
