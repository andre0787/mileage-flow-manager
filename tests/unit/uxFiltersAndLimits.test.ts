import { describe, expect, it } from "vitest";
import { ALL_PROGRAMS } from "@/components/ui/ProgramFilter";
import { countPassengersInCycle, type CycleSale } from "@/lib/passengerCycle";
import type { Account, Program, Sale } from "@/types";

describe("P3: Validação de Filtros de UI e Limites de Passageiro", () => {
  describe("Filtro de Programas em Vendas (PR #572)", () => {
    const mockPrograms: Program[] = [
      { id: "prog-latam", name: "LATAM Pass", type: "milhas" },
      { id: "prog-smiles", name: "Smiles", type: "milhas" },
    ];

    const mockSales: Partial<Sale>[] = [
      { id: "s1", program: "LATAM Pass", status: "emitido", ownerName: "João" },
      { id: "s2", program: "Smiles", status: "emitido", ownerName: "Maria" },
      { id: "s3", program: "latam pass", status: "pendente", ownerName: "João" },
    ];

    it("retorna todas as vendas quando o filtro é ALL_PROGRAMS", () => {
      const filterValue = ALL_PROGRAMS;
      const selectedProgramName =
        filterValue === ALL_PROGRAMS
          ? null
          : (mockPrograms.find((p) => p.id === filterValue)?.name ?? null);

      const filtered = mockSales.filter((s) => {
        if (!selectedProgramName) return true;
        return (s.program ?? "").trim().toLowerCase() === selectedProgramName.trim().toLowerCase();
      });

      expect(filtered.length).toBe(3);
    });

    it("filtra vendas corretamente pelo ID do programa selecionado", () => {
      const filterValue = "prog-latam";
      const selectedProgramName =
        filterValue === ALL_PROGRAMS
          ? null
          : (mockPrograms.find((p) => p.id === filterValue)?.name ?? null);

      const filtered = mockSales.filter((s) => {
        if (!selectedProgramName) return true;
        return (s.program ?? "").trim().toLowerCase() === selectedProgramName.trim().toLowerCase();
      });

      expect(filtered.length).toBe(2);
      expect(filtered.map((s) => s.id)).toEqual(["s1", "s3"]);
    });
  });

  describe("Filtro de Programas em Entradas (PR #573)", () => {
    const mockAccounts: Partial<Account>[] = [
      { id: "acc-1", name: "Conta LATAM 1", programId: "prog-latam", type: "milhas" },
      { id: "acc-2", name: "Conta Smiles 1", programId: "prog-smiles", type: "milhas" },
    ];

    const mockEntries = [
      { id: "e1", accountId: "acc-1", quantity: 10000 },
      { id: "e2", accountId: "acc-2", quantity: 20000 },
    ];

    it("retorna todas as entradas quando o filtro é ALL_PROGRAMS", () => {
      const filterValue = ALL_PROGRAMS;
      const programAccountIds =
        filterValue === ALL_PROGRAMS
          ? null
          : new Set(mockAccounts.filter((a) => a.programId === filterValue).map((a) => a.id));

      const filtered = programAccountIds
        ? mockEntries.filter((e) => programAccountIds.has(e.accountId))
        : mockEntries;

      expect(filtered.length).toBe(2);
    });

    it("filtra entradas pelas contas associadas ao programa selecionado", () => {
      const filterValue = "prog-latam";
      const programAccountIds =
        filterValue === ALL_PROGRAMS
          ? null
          : new Set(mockAccounts.filter((a) => a.programId === filterValue).map((a) => a.id));

      const filtered = programAccountIds
        ? mockEntries.filter((e) => programAccountIds.has(e.accountId))
        : mockEntries;

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("e1");
    });
  });

  describe("Regra de Limite de Passageiros por Titular (PR #570)", () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const mockSalesForLimit: CycleSale[] = [
      {
        id: "sale-1",
        program: "Smiles",
        ownerName: "Carlos",
        date: todayStr,
        passengers: ["P1", "P2", "P3"],
      },
      {
        id: "sale-2",
        program: "Smiles",
        ownerName: "Carlos",
        date: todayStr,
        passengers: ["P4", "P5"],
      },
      {
        id: "sale-other-owner",
        program: "Smiles",
        ownerName: "Ana",
        date: todayStr,
        passengers: ["P1", "P2", "P3", "P4", "P5"],
      },
    ];

    it("calcula corretamente o total de passageiros usados no ciclo anual", () => {
      const count = countPassengersInCycle(mockSalesForLimit, {
        program: "Smiles",
        ownerName: "Carlos",
        cycleType: "anual",
      });

      expect(count).toBe(5);
    });

    it("desconsidera vendas de outros titulares ou de outros programas", () => {
      const countAna = countPassengersInCycle(mockSalesForLimit, {
        program: "Smiles",
        ownerName: "Ana",
        cycleType: "anual",
      });

      expect(countAna).toBe(5);

      const countOtherProg = countPassengersInCycle(mockSalesForLimit, {
        program: "LATAM Pass",
        ownerName: "Carlos",
        cycleType: "anual",
      });

      expect(countOtherProg).toBe(0);
    });

    it("calcula passageiros no ciclo de N dias", () => {
      const count = countPassengersInCycle(mockSalesForLimit, {
        program: "Smiles",
        ownerName: "Carlos",
        cycleType: "dias",
        cycleDays: 365,
      });

      expect(count).toBe(5);
    });
  });
});
