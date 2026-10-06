import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { ProgramFilter, ALL_PROGRAMS } from "@/components/ui/ProgramFilter";
import {
  countPassengersInCycle,
  isInCurrentCycle,
  getCycleLabel,
} from "@/lib/passengerCycle";
import { useClientCycleAvailability } from "@/hooks/useClientCycleAvailability";
import type { Sale, Program } from "@/types";

describe("UI ProgramFilter Component (PR #572 & PR #573)", () => {
  const mockPrograms: Program[] = [
    { id: "p1", name: "Smiles", type: "milhas" },
    { id: "p2", name: "Latam Pass", type: "milhas" },
  ];

  it("renderiza o seletor com opção 'Todos os Programas' e os programas disponíveis", () => {
    const onChange = vi.fn();
    render(
      <ProgramFilter
        programs={mockPrograms}
        value={ALL_PROGRAMS}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Todos os Programas")).toBeDefined();
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Smiles")).toBeDefined();
    expect(screen.getByText("Latam Pass")).toBeDefined();
  });

  it("dispara onChange com o ID do programa selecionado", () => {
    const onChange = vi.fn();
    render(
      <ProgramFilter
        programs={mockPrograms}
        value={ALL_PROGRAMS}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Latam Pass"));
    expect(onChange).toHaveBeenCalledWith("p2");
  });
});

describe("Regra de Limite de Passageiros por Titular (PR #570)", () => {
  const currentYear = new Date().getFullYear();

  it("calcula corretamente passageiros do ciclo com countPassengersInCycle e getCycleLabel", () => {
    const sales = [
      {
        id: "s1",
        ownerName: "João",
        program: "Smiles",
        date: `${currentYear}-03-10`,
        passengers: [{ name: "P1" }, { name: "P2" }],
      },
      {
        id: "s2",
        ownerName: "João",
        program: "Smiles",
        date: `${currentYear}-04-15`,
        passengers: [{ name: "P3" }],
      },
      {
        id: "s3",
        ownerName: "Maria",
        program: "Smiles",
        date: `${currentYear}-04-15`,
        passengers: [{ name: "P4" }],
      },
    ];

    const count = countPassengersInCycle(sales, {
      program: "Smiles",
      ownerName: "João",
      cycleType: "anual",
    });

    expect(count).toBe(3);
    expect(getCycleLabel({ id: "p1", name: "Smiles", type: "milhas", passengerCycleType: "anual" })).toBe(
      currentYear.toString(),
    );
  });

  it("valida inclusão no ciclo com isInCurrentCycle", () => {
    const program: Program = {
      id: "p1",
      name: "Smiles",
      type: "milhas",
      maxPassengers: 25,
      passengerCycleType: "anual",
    };

    expect(isInCurrentCycle(program, `${currentYear}-05-10`)).toBe(true);
    expect(isInCurrentCycle(program, `${currentYear - 1}-05-10`)).toBe(false);
  });

  it("retorna relatórios de disponibilidade no hook useClientCycleAvailability", () => {
    const programs: Program[] = [
      {
        id: "p1",
        name: "Smiles",
        type: "milhas",
        maxPassengers: 5,
        passengerCycleType: "anual",
      },
    ];

    const sales: Sale[] = [
      {
        id: "s1",
        accountName: "Conta 1",
        ownerName: "João",
        program: "Smiles",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "LOC123",
        passengers: [
          { name: "P1", passengerId: "pass1", cpf: "111", clientId: "c1" },
        ],
        date: `${currentYear}-02-10`,
      },
    ];

    const { result } = renderHook(() =>
      useClientCycleAvailability(sales, programs),
    );

    expect(result.current.usage).toHaveLength(1);
    expect(result.current.usage[0].used).toBe(1);
    expect(result.current.usage[0].limit).toBe(5);
    expect(result.current.usage[0].available).toBe(4);
    expect(result.current.programs).toContain("Smiles");
    expect(result.current.owners).toContain("João");
  });
});
