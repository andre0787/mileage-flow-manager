import { describe, it, expect } from "vitest";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";

describe("todayISODate", () => {
  it("retorna hoje em YYYY-MM-DD no fuso da operação", () => {
    const got = todayISODate();
    expect(got).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isValidISODate(got)).toBe(true);
    const expected = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(got).toBe(expected);
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
