import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  countPassengersInCycle,
  getCycleLabel,
  isInCurrentCycle,
  type CycleSale,
} from "@/lib/passengerCycle";
import type { Program } from "@/types";

const mk = (
  id: string,
  ownerName: string,
  program: string,
  date: string,
  n: number,
): CycleSale => ({
  id,
  ownerName,
  program,
  date,
  passengers: Array.from({ length: n }, (_, i) => ({ i })),
});

describe("countPassengersInCycle", () => {
  const currentYear = new Date().getFullYear();

  it("conta só o dono informado (limite é por dono, não global)", () => {
    const sales = [
      mk("s1", "Rodrigo lemes", "Latam", `${currentYear}-03-10`, 20),
      mk("s2", "Fabio Ivo", "Latam", `${currentYear}-04-11`, 22),
    ];
    const used = countPassengersInCycle(sales, {
      program: "Latam",
      ownerName: "Rodrigo lemes",
      cycleType: "anual",
    });
    // 22 do outro dono não somam — regressão do bloqueio indevido da issue #569
    expect(used).toBe(20);
  });

  it("ignora outros programas", () => {
    const sales = [
      mk("s1", "Rodrigo lemes", "Latam", `${currentYear}-03-10`, 5),
      mk("s2", "Rodrigo lemes", "Smiles", `${currentYear}-03-10`, 7),
    ];
    expect(
      countPassengersInCycle(sales, {
        program: "Latam",
        ownerName: "Rodrigo lemes",
        cycleType: "anual",
      }),
    ).toBe(5);
  });

  it("exclui a venda em edição (sem dupla contagem)", () => {
    const sales = [
      mk("s1", "Rodrigo lemes", "Latam", `${currentYear}-03-10`, 3),
      mk("s2", "Rodrigo lemes", "Latam", `${currentYear}-04-11`, 2),
    ];
    expect(
      countPassengersInCycle(sales, {
        program: "Latam",
        ownerName: "Rodrigo lemes",
        editingSaleId: "s2",
        cycleType: "anual",
      }),
    ).toBe(3);
  });

  it("ciclo anual conta só o ano vigente", () => {
    const sales = [
      mk("s1", "Ana", "Smiles", `${currentYear}-02-15`, 4),
      mk("s2", "Ana", "Smiles", `${currentYear - 1}-11-20`, 6),
    ];
    expect(
      countPassengersInCycle(sales, { program: "Smiles", ownerName: "Ana", cycleType: "anual" }),
    ).toBe(4);
  });

  it("ciclo em dias respeita o cutoff", () => {
    const today = new Date();
    const recent = new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0];
    const old = new Date(today.getTime() - 40 * 86400000).toISOString().split("T")[0];
    const sales = [
      mk("s1", "Carlos", "TudoAzul", recent, 2),
      mk("s2", "Carlos", "TudoAzul", old, 9),
    ];
    expect(
      countPassengersInCycle(sales, {
        program: "TudoAzul",
        ownerName: "Carlos",
        cycleType: "dias",
        cycleDays: 30,
      }),
    ).toBe(2);
  });

  it("trata seguro quando ownerName for nulo ou indefinido nas vendas", () => {
    const sales: CycleSale[] = [
      { id: "s1", ownerName: null, program: "Latam", date: `${currentYear}-01-10`, passengers: [1, 2] },
      { id: "s2", ownerName: "Maria", program: "Latam", date: `${currentYear}-01-11`, passengers: [1] },
    ];
    expect(
      countPassengersInCycle(sales, {
        program: "Latam",
        ownerName: "Maria",
        cycleType: "anual",
      }),
    ).toBe(1);
  });
});

describe("isInCurrentCycle e getCycleLabel", () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "America/Sao_Paulo";
    vi.useFakeTimers();
    // Fixa o tempo do sistema em 15/06/2026 12:00:00 UTC
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTZ;
  });

  describe("isInCurrentCycle - ciclo anual", () => {
    const annualProgram: Program = {
      id: "p1",
      name: "Smiles",
      type: "milhas",
      passengerCycleType: "anual",
    };

    it("retorna true para datas no ano atual (ex: 2026-01-01 e 2026-06-15)", () => {
      expect(isInCurrentCycle(annualProgram, "2026-01-01")).toBe(true);
      expect(isInCurrentCycle(annualProgram, "2026-06-15")).toBe(true);
      expect(isInCurrentCycle(annualProgram, "2026-12-31")).toBe(true);
    });

    it("retorna false para datas de anos anteriores ou futuros", () => {
      expect(isInCurrentCycle(annualProgram, "2025-12-31")).toBe(false);
      expect(isInCurrentCycle(annualProgram, "2027-01-01")).toBe(false);
    });

    it("trata programa sem passengerCycleType definido como ciclo anual", () => {
      const defaultProgram: Program = {
        id: "p2",
        name: "Latam Pass",
        type: "milhas",
      };
      expect(isInCurrentCycle(defaultProgram, "2026-05-10")).toBe(true);
      expect(isInCurrentCycle(defaultProgram, "2025-05-10")).toBe(false);
    });
  });

  describe("isInCurrentCycle - ciclo por dias", () => {
    const daysProgram: Program = {
      id: "p3",
      name: "TudoAzul",
      type: "milhas",
      passengerCycleType: "dias",
      passengerCycleDays: 30,
    };

    it("retorna true para vendas dentro da janela de dias especificada", () => {
      // Hoje simulado: 2026-06-15
      // 10 dias atrás: 2026-06-05
      expect(isInCurrentCycle(daysProgram, "2026-06-05")).toBe(true);
      // Exatamente no limite de 30 dias (2026-05-16 a 2026-06-15)
      expect(isInCurrentCycle(daysProgram, "2026-05-16")).toBe(true);
    });

    it("retorna false para vendas mais antigas que a janela de dias", () => {
      // 35 dias atrás: 2026-05-11
      expect(isInCurrentCycle(daysProgram, "2026-05-11")).toBe(false);
    });

    it("retorna true se passengerCycleDays não for definido ou for <= 0", () => {
      const programNoDays: Program = {
        id: "p4",
        name: "Iberia",
        type: "milhas",
        passengerCycleType: "dias",
      };
      const programZeroDays: Program = {
        id: "p5",
        name: "TAP",
        type: "milhas",
        passengerCycleType: "dias",
        passengerCycleDays: 0,
      };

      expect(isInCurrentCycle(programNoDays, "2020-01-01")).toBe(true);
      expect(isInCurrentCycle(programZeroDays, "2020-01-01")).toBe(true);
    });
  });

  describe("getCycleLabel", () => {
    it("retorna 'Últimos N dias' para ciclo do tipo dias com passengerCycleDays definido", () => {
      const program: Program = {
        id: "p1",
        name: "TudoAzul",
        type: "milhas",
        passengerCycleType: "dias",
        passengerCycleDays: 60,
      };
      expect(getCycleLabel(program)).toBe("Últimos 60 dias");
    });

    it("retorna o ano atual para ciclo anual ou padrão", () => {
      const annualProgram: Program = {
        id: "p2",
        name: "Smiles",
        type: "milhas",
        passengerCycleType: "anual",
      };
      const defaultProgram: Program = {
        id: "p3",
        name: "Latam Pass",
        type: "milhas",
      };
      expect(getCycleLabel(annualProgram)).toBe("2026");
      expect(getCycleLabel(defaultProgram)).toBe("2026");
    });
  });
});
