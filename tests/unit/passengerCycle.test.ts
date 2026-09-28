import { describe, expect, it } from "vitest";
import { countPassengersInCycle, getCycleLabel, isInCurrentCycle, type CycleSale } from "@/lib/passengerCycle";
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

describe("getCycleLabel", () => {
  it("retorna 'Últimos N dias' quando cycleType for 'dias' e houver passengerCycleDays", () => {
    const program: Program = {
      id: "p1",
      name: "Smiles",
      type: "milhas",
      passengerCycleType: "dias",
      passengerCycleDays: 30,
    };
    expect(getCycleLabel(program)).toBe("Últimos 30 dias");
  });

  it("retorna o ano atual quando cycleType for 'anual'", () => {
    const program: Program = {
      id: "p2",
      name: "Latam",
      type: "milhas",
      passengerCycleType: "anual",
    };
    const currentYear = new Date().getFullYear().toString();
    expect(getCycleLabel(program)).toBe(currentYear);
  });

  it("retorna o ano atual quando cycleType for 'dias' mas sem passengerCycleDays", () => {
    const program: Program = {
      id: "p3",
      name: "TudoAzul",
      type: "milhas",
      passengerCycleType: "dias",
      passengerCycleDays: 0,
    };
    const currentYear = new Date().getFullYear().toString();
    expect(getCycleLabel(program)).toBe(currentYear);
  });

  it("retorna o ano atual quando passengerCycleType for indefinido", () => {
    const program: Program = {
      id: "p4",
      name: "TAP",
      type: "milhas",
    };
    const currentYear = new Date().getFullYear().toString();
    expect(getCycleLabel(program)).toBe(currentYear);
  });
});

describe("isInCurrentCycle", () => {
  const currentYear = new Date().getFullYear();

  it("valida venda no ciclo anual pelo ano vigente", () => {
    const program: Program = {
      id: "p1",
      name: "Smiles",
      type: "milhas",
      passengerCycleType: "anual",
    };
    expect(isInCurrentCycle(program, `${currentYear}-05-10`)).toBe(true);
    expect(isInCurrentCycle(program, `${currentYear - 1}-12-31`)).toBe(false);
  });

  it("retorna true para ciclo em dias quando passengerCycleDays não é definido ou é <= 0", () => {
    const program: Program = {
      id: "p2",
      name: "Latam",
      type: "milhas",
      passengerCycleType: "dias",
    };
    expect(isInCurrentCycle(program, "2020-01-01")).toBe(true);
  });

  it("valida venda no ciclo de dias considerando os dias decorridos", () => {
    const program: Program = {
      id: "p3",
      name: "TudoAzul",
      type: "milhas",
      passengerCycleType: "dias",
      passengerCycleDays: 30,
    };
    const today = new Date();
    const recent = new Date(today.getTime() - 10 * 86400000).toISOString().split("T")[0];
    const old = new Date(today.getTime() - 40 * 86400000).toISOString().split("T")[0];

    expect(isInCurrentCycle(program, recent)).toBe(true);
    expect(isInCurrentCycle(program, old)).toBe(false);
  });
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
