import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { addMonthsClamped, formatDateBR, parseDateOnly } from "@/lib/dateUtils";

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

  it("define o horário local para meio-dia (12:00:00) ao receber YYYY-MM-DD", () => {
    const d = parseDateOnly("2026-08-15");
    expect(d.getHours()).toBe(12);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("preserva limites do mês, fim do ano e ano bissexto", () => {
    const endJan = parseDateOnly("2026-01-31");
    expect(endJan.getMonth()).toBe(0);
    expect(endJan.getDate()).toBe(31);

    const endDec = parseDateOnly("2026-12-31");
    expect(endDec.getMonth()).toBe(11);
    expect(endDec.getDate()).toBe(31);

    const leap = parseDateOnly("2024-02-29");
    expect(leap.getFullYear()).toBe(2024);
    expect(leap.getMonth()).toBe(1);
    expect(leap.getDate()).toBe(29);
  });

  it("passa direto strings ISO completas (com hora e offset)", () => {
    const fullUtc = new Date("2026-08-05T15:30:00.000Z");
    expect(parseDateOnly("2026-08-05T15:30:00.000Z").getTime()).toBe(fullUtc.getTime());

    const fullOffset = new Date("2026-08-05T10:00:00-03:00");
    expect(parseDateOnly("2026-08-05T10:00:00-03:00").getTime()).toBe(fullOffset.getTime());
  });

  it("lida com entradas inválidas ou formatos não-ISO de forma segura", () => {
    expect(isNaN(parseDateOnly("invalid").getTime())).toBe(true);
    expect(isNaN(parseDateOnly("").getTime())).toBe(true);
  });
});

describe("addMonthsClamped", () => {
  it("adiciona meses normais sem alteração no dia", () => {
    expect(addMonthsClamped("2026-01-15", 2)).toBe("2026-03-15");
    expect(addMonthsClamped("2026-05-10", 6)).toBe("2026-11-10");
  });

  it("limita o dia ao último dia do mês de destino (clamp de fim de mês)", () => {
    // 31 de janeiro em ano não bissexto -> 28 de fevereiro
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    // 31 de março + 6 meses -> 30 de setembro (setembro tem 30 dias)
    expect(addMonthsClamped("2026-03-31", 6)).toBe("2026-09-30");
    // 31 de agosto + 1 mês -> 30 de setembro
    expect(addMonthsClamped("2026-08-31", 1)).toBe("2026-09-30");
  });

  it("trata ano bissexto corretamente em fevereiro (29 dias em ano bissexto)", () => {
    // 2024 é ano bissexto (29 de fev)
    expect(addMonthsClamped("2024-01-31", 1)).toBe("2024-02-29");
    // 2025 não é bissexto (28 de fev)
    expect(addMonthsClamped("2025-01-31", 1)).toBe("2025-02-28");
  });

  it("suporta rollover de ano para prazos que cruzam múltiplos anos", () => {
    expect(addMonthsClamped("2025-11-15", 3)).toBe("2026-02-15");
    expect(addMonthsClamped("2025-10-31", 4)).toBe("2026-02-28");
    expect(addMonthsClamped("2025-11-15", 14)).toBe("2027-01-15");
  });

  it("respeita o parâmetro dayOfMonth customizado quando fornecido", () => {
    // Sobrescreve o dia base (dia 15 da data base vira dia 31 clamping para fev -> 28)
    expect(addMonthsClamped("2026-01-15", 1, 31)).toBe("2026-02-28");
    // dayOfMonth menor que o dia base da data
    expect(addMonthsClamped("2026-01-31", 1, 10)).toBe("2026-02-10");
  });

  it("funciona com offset de meses negativo", () => {
    expect(addMonthsClamped("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonthsClamped("2026-05-15", -2)).toBe("2026-03-15");
  });

  it("aceita strings ISO completas com hora sem quebrar a data base", () => {
    expect(addMonthsClamped("2026-01-31T18:00:00Z", 1)).toBe("2026-02-28");
  });
});
