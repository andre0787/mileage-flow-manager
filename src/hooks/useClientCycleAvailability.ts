import { useMemo } from "react";
import type { Sale, Program } from "@/types";

export interface ClientUsage {
  clientId: string;
  name: string;
  cpf: string;
  lastSaleDate: string;
}

export interface ProgramOwnerUsage {
  programName: string;
  ownerName: string;
  cycleLabel: string;
  limit: number | null;
  used: number;
  available: number | null;
  percentage: number;
  clients: ClientUsage[];
}

export function useClientCycleAvailability(sales: Sale[], programs: Program[]) {
  return useMemo(() => {
    const programsByName = new Map(programs.map((p) => [p.name, p]));
    const usageByKey = new Map<string, ProgramOwnerUsage>();
    const allPrograms = new Set<string>();
    const allOwners = new Set<string>();

    for (const sale of sales) {
      if (!sale.passengers?.length) continue;

      const program = programsByName.get(sale.program);
      if (!program) continue;

      if (!isInCurrentCycle(program, sale.date)) continue;

      allPrograms.add(sale.program);
      allOwners.add(sale.ownerName);

      const key = `${sale.program}|${sale.ownerName}`;

      if (!usageByKey.has(key)) {
        usageByKey.set(key, {
          programName: sale.program,
          ownerName: sale.ownerName,
          cycleLabel: getCycleLabel(program),
          limit: program.maxPassengers ?? null,
          used: 0,
          available: null,
          percentage: 0,
          clients: [],
        });
      }

      const entry = usageByKey.get(key)!;

      for (const passenger of sale.passengers) {
        const id = passenger.clientId || passenger.cpf;
        if (!id) continue;

        const existing = entry.clients.find((c) => c.clientId === id);
        if (existing) {
          if (sale.date > existing.lastSaleDate) {
            existing.lastSaleDate = sale.date;
          }
        } else {
          entry.clients.push({
            clientId: id,
            name: passenger.name,
            cpf: passenger.cpf,
            lastSaleDate: sale.date,
          });
        }
      }
    }

    for (const entry of usageByKey.values()) {
      entry.used = entry.clients.length;
      if (entry.limit !== null) {
        entry.available = Math.max(0, entry.limit - entry.used);
        entry.percentage = (entry.used / entry.limit) * 100;
      }
    }

    const usage = Array.from(usageByKey.values());
    usage.sort((a, b) => b.percentage - a.percentage || a.programName.localeCompare(b.programName));

    return {
      usage,
      programs: Array.from(allPrograms).sort(),
      owners: Array.from(allOwners).sort(),
    };
  }, [sales, programs]);
}

function isInCurrentCycle(program: Program, saleDate: string): boolean {
  const date = new Date(saleDate);

  if (program.passengerCycleType === "dias") {
    if (!program.passengerCycleDays || program.passengerCycleDays <= 0) return true;
    const diffDays = (Date.now() - date.getTime()) / 86400000;
    return diffDays <= program.passengerCycleDays;
  }

  const currentYear = new Date().getFullYear();
  return date.getFullYear() === currentYear;
}

function getCycleLabel(program: Program): string {
  if (program.passengerCycleType === "dias" && program.passengerCycleDays) {
    return `Últimos ${program.passengerCycleDays} dias`;
  }
  return new Date().getFullYear().toString();
}
