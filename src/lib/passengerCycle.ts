import { parseDateOnly } from "@/lib/dateUtils";
import type { Program } from "@/types";

/** Diz se a venda está dentro do ciclo vigente do programa (anual ou últimos N dias). */
export function isInCurrentCycle(program: Program, saleDate: string): boolean {
  // ponytail: parseDateOnly evita o bug de fuso #308 — em America/Sao_Paulo,
  // new Date("YYYY-MM-DD") cai no dia anterior 21h e quebra o ciclo anual
  // (venda de 01/01 contada no ano errado) e o diff de dias do ciclo "dias".
  const date = parseDateOnly(saleDate);

  if (program.passengerCycleType === "dias") {
    if (!program.passengerCycleDays || program.passengerCycleDays <= 0) return true;
    const diffDays = (Date.now() - date.getTime()) / 86400000;
    return diffDays <= program.passengerCycleDays;
  }

  const currentYear = new Date().getFullYear();
  return date.getFullYear() === currentYear;
}

/** Rótulo do ciclo vigente do programa (ex.: "2026" ou "Últimos 30 dias"). */
export function getCycleLabel(program: Program): string {
  if (program.passengerCycleType === "dias" && program.passengerCycleDays) {
    return `Últimos ${program.passengerCycleDays} dias`;
  }
  return new Date().getFullYear().toString();
}
