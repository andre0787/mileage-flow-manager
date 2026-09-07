import { describe, expect, it } from "vitest";
import { getCycleLabel, isInCurrentCycle } from "@/lib/passengerCycle";
import type { Program } from "@/types";

describe("passengerCycle", () => {
  const currentYear = new Date().getFullYear();
  const base: Program = { id: "p1", name: "Smiles", type: "milhas" };

  it("ciclo anual inclui vendas do ano atual e exclui outros anos", () => {
    const program: Program = { ...base, passengerCycleType: "anual" };
    expect(isInCurrentCycle(program, `${currentYear}-01-01`)).toBe(true);
    expect(isInCurrentCycle(program, `${currentYear}-12-31`)).toBe(true);
    expect(isInCurrentCycle(program, `${currentYear - 1}-06-15`)).toBe(false);
  });

  it("programa sem tipo de ciclo usa o ano atual", () => {
    expect(isInCurrentCycle(base, `${currentYear}-05-10`)).toBe(true);
    expect(isInCurrentCycle(base, `${currentYear - 1}-05-10`)).toBe(false);
  });

  it("ciclo por dias respeita a janela e ignora limite <= 0", () => {
    const program: Program = {
      ...base,
      passengerCycleType: "dias",
      passengerCycleDays: 30,
    };
    const today = new Date();
    const recent = new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0];
    const old = new Date(today.getTime() - 40 * 86400000).toISOString().split("T")[0];
    expect(isInCurrentCycle(program, recent)).toBe(true);
    expect(isInCurrentCycle(program, old)).toBe(false);

    const noLimit: Program = {
      ...base,
      passengerCycleType: "dias",
      passengerCycleDays: 0,
    };
    expect(isInCurrentCycle(noLimit, old)).toBe(true);
  });

  it("getCycleLabel descreve o ciclo vigente", () => {
    expect(getCycleLabel(base)).toBe(currentYear.toString());
    expect(getCycleLabel({ ...base, passengerCycleType: "dias", passengerCycleDays: 30 })).toBe(
      "Últimos 30 dias",
    );
  });
});
