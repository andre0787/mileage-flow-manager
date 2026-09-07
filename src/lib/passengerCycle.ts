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

/** Venda mínima necessária para a contagem de passageiros do ciclo. */
export interface CycleSale {
  id: string;
  program: string;
  ownerName?: string | null;
  date: string;
  passengers: readonly unknown[];
}

/** Filtros da contagem de passageiros do ciclo. */
export interface PassengerCycleCountInput {
  program: string;
  ownerName: string;
  editingSaleId?: string;
  cycleType?: Program["passengerCycleType"];
  cycleDays?: number;
  now?: Date;
}

/**
 * Conta passageiros usados no ciclo vigente por (programa + dono).
 * O limite do programa é por dono: vendas de outros donos nunca somam.
 * A venda em edição é excluída para não contar 2x (sales + formulário).
 */
export function countPassengersInCycle(sales: CycleSale[], input: PassengerCycleCountInput): number {
  const now = input.now ?? new Date();
  const owner = input.ownerName ?? "";
  let relevant = sales.filter(
    (s) => s.program === input.program && (s.ownerName ?? "") === owner && s.id !== input.editingSaleId,
  );
  if (input.cycleType === "anual") {
    const year = now.getFullYear();
    relevant = relevant.filter((s) => parseDateOnly(s.date).getFullYear() === year);
  } else if (input.cycleType === "dias" && input.cycleDays) {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - input.cycleDays);
    cutoff.setHours(0, 0, 0, 0);
    relevant = relevant.filter((s) => parseDateOnly(s.date) >= cutoff);
  }
  return relevant.reduce((sum, s) => sum + s.passengers.length, 0);
}
