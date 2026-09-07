import { describe, expect, it } from "vitest";
import { countPassengersInCycle, type CycleSale } from "@/lib/passengerCycle";

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
});
