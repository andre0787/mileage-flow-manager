import { isInCurrentCycle } from "@/lib/passengerCycle";
import type { Program, Sale } from "@/types";

export interface DuplicateEmission {
  saleId: string;
  program: string;
  owner: string;
  date: string;
  ticketLocator: string;
}

export interface DuplicatePassenger {
  /** Identidade do passageiro: clientId ou CPF (mesma regra do hook de disponibilidade). */
  id: string;
  name: string;
  cpf: string;
  emissionCount: number;
  emissions: DuplicateEmission[];
}

export interface DuplicateFilter {
  programName?: string;
  ownerName?: string;
}

/** Identidade única do passageiro (clientId tem precedência; null quando não há ID). */
export function passengerIdentity(passenger: { clientId?: string; cpf: string }): string | null {
  const id = passenger.clientId || passenger.cpf;
  return id || null;
}

/**
 * Encontra passageiros presentes em mais de uma emissão (venda) no ciclo vigente.
 * Duplicados apenas sinalizam — nunca alteram contagem de limite (decisão do council).
 */
export function detectDuplicatePassengers(
  sales: Sale[],
  programs: Program[],
  filter: DuplicateFilter = {},
): DuplicatePassenger[] {
  const programsByName = new Map(programs.map((p) => [p.name, p]));
  const byId = new Map<
    string,
    { name: string; cpf: string; sales: Map<string, DuplicateEmission> }
  >();

  for (const sale of sales) {
    if (filter.programName && sale.program !== filter.programName) continue;
    if (filter.ownerName && sale.ownerName !== filter.ownerName) continue;
    const program = programsByName.get(sale.program);
    if (!program) continue;
    if (!isInCurrentCycle(program, sale.date)) continue;
    if (!sale.passengers?.length) continue;

    for (const passenger of sale.passengers) {
      const id = passengerIdentity(passenger);
      if (!id) continue;
      let entry = byId.get(id);
      if (!entry) {
        entry = { name: passenger.name, cpf: passenger.cpf, sales: new Map() };
        byId.set(id, entry);
      }
      if (!entry.sales.has(sale.id)) {
        entry.sales.set(sale.id, {
          saleId: sale.id,
          program: sale.program,
          owner: sale.ownerName,
          date: sale.date,
          ticketLocator: sale.ticketLocator,
        });
      }
    }
  }

  const result: DuplicatePassenger[] = [];
  for (const [id, entry] of byId) {
    if (entry.sales.size > 1) {
      const emissions = [...entry.sales.values()].sort((a, b) => a.date.localeCompare(b.date));
      result.push({
        id,
        name: entry.name,
        cpf: entry.cpf,
        emissionCount: entry.sales.size,
        emissions,
      });
    }
  }
  result.sort((a, b) => b.emissionCount - a.emissionCount || a.name.localeCompare(b.name));
  return result;
}
