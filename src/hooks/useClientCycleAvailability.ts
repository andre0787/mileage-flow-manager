import { useMemo } from "react";
import { getCycleLabel, isInCurrentCycle } from "@/lib/passengerCycle";
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

interface ProgramOwnerUsageTracker {
  programName: string;
  ownerName: string;
  cycleLabel: string;
  limit: number | null;
  clientsMap: Map<string, ClientUsage>;
}

export function useClientCycleAvailability(sales: Sale[], programs: Program[]) {
  return useMemo(() => {
    const programsByName = new Map(programs.map((p) => [p.name, p]));
    const usageByKey = new Map<string, ProgramOwnerUsageTracker>();
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
          clientsMap: new Map<string, ClientUsage>(),
        });
      }

      const entry = usageByKey.get(key)!;

      for (const passenger of sale.passengers) {
        const id = passenger.clientId || passenger.cpf;
        if (!id) continue;

        const existing = entry.clientsMap.get(id);
        if (existing) {
          if (sale.date > existing.lastSaleDate) {
            existing.lastSaleDate = sale.date;
          }
        } else {
          entry.clientsMap.set(id, {
            clientId: id,
            name: passenger.name,
            cpf: passenger.cpf,
            lastSaleDate: sale.date,
          });
        }
      }
    }

    const usage: ProgramOwnerUsage[] = [];

    for (const tracker of usageByKey.values()) {
      const clients = Array.from(tracker.clientsMap.values());
      const used = clients.length;
      let available: number | null = null;
      let percentage = 0;

      if (tracker.limit !== null) {
        available = Math.max(0, tracker.limit - used);
        percentage = (used / tracker.limit) * 100;
      }

      usage.push({
        programName: tracker.programName,
        ownerName: tracker.ownerName,
        cycleLabel: tracker.cycleLabel,
        limit: tracker.limit,
        used,
        available,
        percentage,
        clients,
      });
    }

    usage.sort((a, b) => b.percentage - a.percentage || a.programName.localeCompare(b.programName));

    return {
      usage,
      programs: Array.from(allPrograms).sort(),
      owners: Array.from(allOwners).sort(),
    };
  }, [sales, programs]);
}
