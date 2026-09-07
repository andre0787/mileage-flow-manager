import { useMemo, useState } from "react";
import { ControleCpfCriticalAlert } from "@/components/ControleCpfCriticalAlert";
import { ControleCpfDetailTable } from "@/components/ControleCpfDetailTable";
import { ControleCpfDuplicates } from "@/components/ControleCpfDuplicates";
import { ControleCpfFilters } from "@/components/ControleCpfFilters";
import { ControleCpfProgramCards } from "@/components/ControleCpfProgramCards";
import { ControleCpfSummaryCards } from "@/components/ControleCpfSummaryCards";
import { useData } from "@/contexts/DataContext";
import { useClientCycleAvailability } from "@/hooks/useClientCycleAvailability";
import { detectDuplicatePassengers } from "@/lib/passengerDuplicates";

export default function ControleCPF() {
  const { sales, programs, isLoading } = useData();
  const { usage, programs: programNames, owners } = useClientCycleAvailability(sales, programs);

  const [selectedProgram, setSelectedProgram] = useState("todos");
  const [selectedOwner, setSelectedOwner] = useState("todos");

  const programFilter = selectedProgram === "todos" ? undefined : selectedProgram;
  const ownerFilter = selectedOwner === "todos" ? undefined : selectedOwner;

  const filteredUsage = useMemo(
    () =>
      usage.filter(
        (u) =>
          (!programFilter || u.programName === programFilter) &&
          (!ownerFilter || u.ownerName === ownerFilter),
      ),
    [usage, programFilter, ownerFilter],
  );

  const duplicates = useMemo(
    () =>
      detectDuplicatePassengers(sales, programs, {
        programName: programFilter,
        ownerName: ownerFilter,
      }),
    [sales, programs, programFilter, ownerFilter],
  );

  const duplicateCounts = useMemo(
    () => new Map(duplicates.map((d) => [d.id, d.emissionCount])),
    [duplicates],
  );

  const totalUniquePassengers = useMemo(
    () => new Set(filteredUsage.flatMap((u) => u.clients.map((c) => c.clientId))).size,
    [filteredUsage],
  );

  const { programsAlert, programsCritical } = useMemo(() => {
    const alert = new Set<string>();
    const critical = new Set<string>();
    for (const u of filteredUsage) {
      if (u.limit === null) continue;
      if (u.used >= u.limit * 0.9) {
        alert.add(u.programName);
        critical.add(u.programName);
      } else if (u.used >= u.limit * 0.8) {
        alert.add(u.programName);
      }
    }
    return { programsAlert: alert.size, programsCritical: critical.size };
  }, [filteredUsage]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="space-y-2 mb-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-80 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Controle de Passageiros por Programa
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitore o número de passageiros por ciclo, programa e dono
          </p>
        </div>
      </div>

      <ControleCpfFilters
        programNames={programNames}
        owners={owners}
        selectedProgram={selectedProgram}
        selectedOwner={selectedOwner}
        onProgramChange={setSelectedProgram}
        onOwnerChange={setSelectedOwner}
      />

      <ControleCpfSummaryCards
        totalPassengers={totalUniquePassengers}
        programsAlert={programsAlert}
        programsCritical={programsCritical}
      />

      <ControleCpfProgramCards entries={filteredUsage} />

      <ControleCpfDuplicates duplicates={duplicates} />

      <ControleCpfDetailTable entries={filteredUsage} duplicateCounts={duplicateCounts} />

      <ControleCpfCriticalAlert entries={filteredUsage} />
    </div>
  );
}
