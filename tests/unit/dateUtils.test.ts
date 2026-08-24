import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { formatDateBR, parseDateOnly } from "@/lib/dateUtils";

const ORIGINAL_TZ = process.env.TZ;

// Fixa TZ negativa para reproduzir o bug de fuso (independe do TZ do runner/CI)
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe("formatDateBR", () => {
  it("formata data ISO date-only em pt-BR sem deslocar o dia (fuso -3)", () => {
    expect(formatDateBR("2026-08-05")).toBe("05/08/2026");
  });

  it("formata datas no início do mês e do ano corretamente", () => {
    expect(formatDateBR("2026-01-01")).toBe("01/01/2026");
    expect(formatDateBR("2026-12-31")).toBe("31/12/2026");
  });

  it("não desloca dia mesmo com TZ negativa (bug histórico: new Date(date) UTC → dia anterior)", () => {
    // Sem a correção, em America/Sao_Paulo: new Date("2026-08-05") → 04/08/2026
    expect(formatDateBR("2026-03-01")).toBe("01/03/2026");
    expect(formatDateBR("2026-07-15")).toBe("15/07/2026");
  });

  it("passa direto strings ISO completas (com hora) e formata de acordo", () => {
    // Em fuso -3, 2026-08-05T01:30:00Z vira 2026-08-04T22:30:00-03:00.
    // formatDateBR usa toLocaleDateString, então deve retornar "04/08/2026".
    expect(formatDateBR("2026-08-05T01:30:00Z")).toBe("04/08/2026");
  });

  it("lida graciosamente com entradas inválidas", () => {
    expect(formatDateBR("invalid")).toBe("Invalid Date");
    expect(formatDateBR("")).toBe("Invalid Date");
  });
});

describe("parseDateOnly", () => {
  it("preserva o mês/dia para agrupamento mensal em TZ negativa (bug: new Date(date) UTC → mês anterior)", () => {
    // Sem a correção, em America/Sao_Paulo: new Date("2026-08-01") → 31/07 21h → getMonth() 6
    const d = parseDateOnly("2026-08-01");
    expect(d.getMonth()).toBe(7); // agosto
    expect(d.getFullYear()).toBe(2026);
    expect(d.getDate()).toBe(1);
  });

  it("preserva dia 1º de janeiro (rollover de ano)", () => {
    const d = parseDateOnly("2026-01-01");
    expect(d.getMonth()).toBe(0);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getDate()).toBe(1);
  });

  it("passa direto strings ISO completas (com hora)", () => {
    const full = new Date("2026-08-05T15:30:00.000Z");
    expect(parseDateOnly("2026-08-05T15:30:00.000Z").getTime()).toBe(full.getTime());
  });
});
