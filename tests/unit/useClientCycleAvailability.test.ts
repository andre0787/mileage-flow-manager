import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useClientCycleAvailability } from "@/hooks/useClientCycleAvailability";
import type { Sale, Program } from "@/types";

describe("useClientCycleAvailability", () => {
  const currentYear = new Date().getFullYear();

  it("retorna arrays vazios quando sales e programs estão vazios", () => {
    const { result } = renderHook(() => useClientCycleAvailability([], []));
    expect(result.current).toEqual({
      usage: [],
      programs: [],
      owners: [],
    });
  });

  it("ignora vendas sem passageiros, sem programa correspondente ou sem ID/CPF de passageiro", () => {
    const programs: Program[] = [
      { id: "p1", name: "Smiles", type: "milhas", maxPassengers: 25 },
    ];

    const sales: Sale[] = [
      // Sem passageiros
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
        ticketLocator: "ABC123",
        passengers: [],
        date: `${currentYear}-05-10`,
      },
      // Programa inexistente
      {
        id: "s2",
        accountName: "Conta 1",
        ownerName: "João",
        program: "Latam Pass",
        clientId: "c2",
        clientName: "Cliente 2",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "ABC124",
        passengers: [{ name: "Passageiro 1", passengerId: "p1", cpf: "123" }],
        date: `${currentYear}-05-10`,
      },
      // Passageiro sem clientId nem cpf
      {
        id: "s3",
        accountName: "Conta 1",
        ownerName: "João",
        program: "Smiles",
        clientId: "c3",
        clientName: "Cliente 3",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "ABC125",
        passengers: [{ name: "Sem ID", passengerId: "p2", cpf: "" }],
        date: `${currentYear}-05-10`,
      },
    ];

    const { result } = renderHook(() => useClientCycleAvailability(sales, programs));
    // s1 (sem passageiros) e s2 (sem programa) são totalmente ignoradas.
    // s3 possui passageiro mas sem ID/CPF, criando o registro com used=0 e clients=[].
    expect(result.current.usage).toEqual([
      {
        programName: "Smiles",
        ownerName: "João",
        cycleLabel: currentYear.toString(),
        limit: 25,
        used: 0,
        available: 25,
        percentage: 0,
        clients: [],
      },
    ]);
    expect(result.current.programs).toEqual(["Smiles"]);
    expect(result.current.owners).toEqual(["João"]);
  });

  it("filtra vendas no ciclo anual (ano atual vs outros anos)", () => {
    const programs: Program[] = [
      { id: "p1", name: "Smiles", type: "milhas", maxPassengers: 25, passengerCycleType: "anual" },
    ];

    const sales: Sale[] = [
      // Ano atual
      {
        id: "s1",
        accountName: "Conta 1",
        ownerName: "Maria",
        program: "Smiles",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "ABC123",
        passengers: [{ name: "Passageiro A", passengerId: "pa1", cpf: "11111111111", clientId: "cli1" }],
        date: `${currentYear}-02-15`,
      },
      // Ano passado
      {
        id: "s2",
        accountName: "Conta 1",
        ownerName: "Maria",
        program: "Smiles",
        clientId: "c2",
        clientName: "Cliente 2",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "ABC124",
        passengers: [{ name: "Passageiro B", passengerId: "pa2", cpf: "22222222222", clientId: "cli2" }],
        date: `${currentYear - 1}-11-20`,
      },
    ];

    const { result } = renderHook(() => useClientCycleAvailability(sales, programs));
    expect(result.current.usage).toHaveLength(1);
    expect(result.current.usage[0].used).toBe(1);
    expect(result.current.usage[0].clients[0].clientId).toBe("cli1");
    expect(result.current.usage[0].cycleLabel).toBe(currentYear.toString());
  });

  it("filtra vendas no ciclo por dias (dentro do prazo vs fora do prazo)", () => {
    const programs: Program[] = [
      {
        id: "p1",
        name: "TudoAzul",
        type: "milhas",
        maxPassengers: 10,
        passengerCycleType: "dias",
        passengerCycleDays: 30,
      },
      {
        id: "p2",
        name: "Iberia",
        type: "milhas",
        passengerCycleType: "dias",
        passengerCycleDays: 0, // <= 0 inclui tudo
      },
    ];

    const today = new Date();
    const recentDate = new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0];
    const oldDate = new Date(today.getTime() - 40 * 86400000).toISOString().split("T")[0];

    const sales: Sale[] = [
      // Recente na TudoAzul
      {
        id: "s1",
        accountName: "Conta Azul",
        ownerName: "Carlos",
        program: "TudoAzul",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "AZ1",
        passengers: [{ name: "Novo", passengerId: "p1", cpf: "12345", clientId: "c1" }],
        date: recentDate,
      },
      // Antigo na TudoAzul (> 30 dias)
      {
        id: "s2",
        accountName: "Conta Azul",
        ownerName: "Carlos",
        program: "TudoAzul",
        clientId: "c2",
        clientName: "Cliente 2",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "AZ2",
        passengers: [{ name: "Antigo", passengerId: "p2", cpf: "67890", clientId: "c2" }],
        date: oldDate,
      },
      // Antigo na Iberia (days = 0, inclui tudo)
      {
        id: "s3",
        accountName: "Conta Iberia",
        ownerName: "Carlos",
        program: "Iberia",
        clientId: "c3",
        clientName: "Cliente 3",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "IB1",
        passengers: [{ name: "Passageiro IB", passengerId: "p3", cpf: "99999", clientId: "c3" }],
        date: oldDate,
      },
    ];

    const { result } = renderHook(() => useClientCycleAvailability(sales, programs));
    expect(result.current.usage).toHaveLength(2);

    const tudoAzul = result.current.usage.find((u) => u.programName === "TudoAzul")!;
    expect(tudoAzul.used).toBe(1);
    expect(tudoAzul.clients[0].clientId).toBe("c1");
    expect(tudoAzul.cycleLabel).toBe("Últimos 30 dias");

    const iberia = result.current.usage.find((u) => u.programName === "Iberia")!;
    expect(iberia.used).toBe(1);
    expect(iberia.cycleLabel).toBe(currentYear.toString());
  });

  it("agrupa passageiros por (programa, titular), deduplica clientes e atualiza lastSaleDate", () => {
    const programs: Program[] = [
      { id: "p1", name: "Smiles", type: "milhas", maxPassengers: 5 },
    ];

    const sales: Sale[] = [
      {
        id: "s1",
        accountName: "Conta 1",
        ownerName: "Ana",
        program: "Smiles",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "LOC1",
        passengers: [{ name: "Passageiro Um", passengerId: "p1", cpf: "111", clientId: "cli1" }],
        date: `${currentYear}-03-10`,
      },
      {
        id: "s2",
        accountName: "Conta 1",
        ownerName: "Ana",
        program: "Smiles",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "LOC2",
        passengers: [{ name: "Passageiro Um", passengerId: "p1", cpf: "111", clientId: "cli1" }],
        date: `${currentYear}-05-20`,
      },
      {
        id: "s3",
        accountName: "Conta 1",
        ownerName: "Ana",
        program: "Smiles",
        clientId: "c1",
        clientName: "Cliente 1",
        milesUsed: 10000,
        saleValue: 200,
        costPerMile: 15,
        profit: 50,
        profitMargin: 25,
        status: "concluido",
        ticketLocator: "LOC3",
        passengers: [{ name: "Passageiro Um", passengerId: "p1", cpf: "111", clientId: "cli1" }],
        date: `${currentYear}-01-05`, // data mais antiga
      },
    ];

    const { result } = renderHook(() => useClientCycleAvailability(sales, programs));
    expect(result.current.usage).toHaveLength(1);
    const entry = result.current.usage[0];
    expect(entry.used).toBe(1);
    expect(entry.limit).toBe(5);
    expect(entry.available).toBe(4);
    expect(entry.percentage).toBe(20);
    expect(entry.clients[0].lastSaleDate).toBe(`${currentYear}-05-20`);
  });

  it("calcula limite, disponível (limitando a 0) e porcentagem, além de ordenar resultados", () => {
    const programs: Program[] = [
      { id: "p1", name: "Latam Pass", type: "milhas", maxPassengers: 2 },
      { id: "p2", name: "Smiles", type: "milhas", maxPassengers: 10 },
      { id: "p3", name: "Livelo", type: "pontos", maxPassengers: undefined },
    ];

    const sales: Sale[] = [
      // Latam Pass — 3 clientes (excede o limite de 2)
      {
        id: "s1",
        accountName: "A1",
        ownerName: "Bruno",
        program: "Latam Pass",
        clientId: "c1",
        clientName: "Client 1",
        milesUsed: 1000,
        saleValue: 100,
        costPerMile: 10,
        profit: 10,
        profitMargin: 10,
        status: "concluido",
        ticketLocator: "L1",
        passengers: [
          { name: "P1", passengerId: "p1", cpf: "111", clientId: "cli1" },
          { name: "P2", passengerId: "p2", cpf: "222", clientId: "cli2" },
          { name: "P3", passengerId: "p3", cpf: "333", clientId: "cli3" },
        ],
        date: `${currentYear}-04-01`,
      },
      // Smiles — 2 clientes (2/10 = 20%)
      {
        id: "s2",
        accountName: "A2",
        ownerName: "Bruno",
        program: "Smiles",
        clientId: "c2",
        clientName: "Client 2",
        milesUsed: 1000,
        saleValue: 100,
        costPerMile: 10,
        profit: 10,
        profitMargin: 10,
        status: "concluido",
        ticketLocator: "S1",
        passengers: [
          { name: "P4", passengerId: "p4", cpf: "444", clientId: "cli4" },
          { name: "P5", passengerId: "p5", cpf: "555", clientId: "cli5" },
        ],
        date: `${currentYear}-04-02`,
      },
      // Livelo — 1 cliente (sem limite)
      {
        id: "s3",
        accountName: "A3",
        ownerName: "Alice",
        program: "Livelo",
        clientId: "c3",
        clientName: "Client 3",
        milesUsed: 1000,
        saleValue: 100,
        costPerMile: 10,
        profit: 10,
        profitMargin: 10,
        status: "concluido",
        ticketLocator: "LV1",
        passengers: [{ name: "P6", passengerId: "p6", cpf: "666", clientId: "cli6" }],
        date: `${currentYear}-04-03`,
      },
    ];

    const { result } = renderHook(() => useClientCycleAvailability(sales, programs));

    // usage ordenado por porcentagem decrescente:
    // 1. Latam Pass (150%)
    // 2. Smiles (20%)
    // 3. Livelo (0%)
    expect(result.current.usage).toHaveLength(3);

    const latam = result.current.usage[0];
    expect(latam.programName).toBe("Latam Pass");
    expect(latam.used).toBe(3);
    expect(latam.limit).toBe(2);
    expect(latam.available).toBe(0); // Math.max(0, 2 - 3)
    expect(latam.percentage).toBe(150);

    const smiles = result.current.usage[1];
    expect(smiles.programName).toBe("Smiles");
    expect(smiles.used).toBe(2);
    expect(smiles.limit).toBe(10);
    expect(smiles.available).toBe(8);
    expect(smiles.percentage).toBe(20);

    const livelo = result.current.usage[2];
    expect(livelo.programName).toBe("Livelo");
    expect(livelo.limit).toBeNull();
    expect(livelo.available).toBeNull();
    expect(livelo.percentage).toBe(0);

    // programs e owners ordenados alfabeticamente
    expect(result.current.programs).toEqual(["Latam Pass", "Livelo", "Smiles"]);
    expect(result.current.owners).toEqual(["Alice", "Bruno"]);
  });
});
