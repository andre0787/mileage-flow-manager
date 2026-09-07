import { describe, expect, it } from "vitest";
import { detectDuplicatePassengers, passengerIdentity } from "@/lib/passengerDuplicates";
import type { Program, Sale } from "@/types";

describe("passengerDuplicates", () => {
  const currentYear = new Date().getFullYear();
  const programs: Program[] = [
    { id: "p1", name: "Smiles", type: "milhas", maxPassengers: 5 },
    { id: "p2", name: "Latam Pass", type: "milhas", maxPassengers: 5 },
  ];

  function sale(overrides: Partial<Sale> & { id: string }): Sale {
    return {
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
      ticketLocator: `LOC-${overrides.id}`,
      passengers: [],
      date: `${currentYear}-04-01`,
      ...overrides,
    };
  }

  it("passengerIdentity prioriza clientId e retorna null sem ID", () => {
    expect(passengerIdentity({ clientId: "cli1", cpf: "111" })).toBe("cli1");
    expect(passengerIdentity({ cpf: "111" })).toBe("111");
    expect(passengerIdentity({ clientId: "", cpf: "" })).toBeNull();
  });

  it("retorna vazio quando ninguém se repete entre emissões", () => {
    const sales = [
      sale({
        id: "s1",
        passengers: [{ name: "P1", passengerId: "p1", cpf: "111", clientId: "cli1" }],
      }),
      sale({
        id: "s2",
        passengers: [{ name: "P2", passengerId: "p2", cpf: "222", clientId: "cli2" }],
      }),
    ];
    expect(detectDuplicatePassengers(sales, programs)).toEqual([]);
  });

  it("sinaliza passageiro em mais de uma emissão com onde aparece", () => {
    const passenger = { name: "Repetido", passengerId: "p1", cpf: "111", clientId: "cli1" };
    const sales = [
      sale({ id: "s1", passengers: [passenger], date: `${currentYear}-03-10` }),
      sale({
        id: "s2",
        program: "Latam Pass",
        passengers: [passenger],
        date: `${currentYear}-05-20`,
      }),
    ];
    const result = detectDuplicatePassengers(sales, programs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("cli1");
    expect(result[0].emissionCount).toBe(2);
    expect(result[0].emissions.map((e) => e.saleId)).toEqual(["s1", "s2"]);
    expect(result[0].emissions[1].program).toBe("Latam Pass");
  });

  it("não conta duas vezes o mesmo passageiro dentro da mesma emissão", () => {
    const passenger = { name: "Duplo", passengerId: "p1", cpf: "111", clientId: "cli1" };
    const sales = [
      sale({ id: "s1", passengers: [passenger, { ...passenger }] }),
      sale({
        id: "s2",
        passengers: [{ name: "Outro", passengerId: "p2", cpf: "222" }],
      }),
    ];
    expect(detectDuplicatePassengers(sales, programs)).toEqual([]);
  });

  it("casa por CPF quando não há clientId e ignora sem ID", () => {
    const sales = [
      sale({
        id: "s1",
        passengers: [{ name: "Sem Client", passengerId: "p1", cpf: "999" }],
      }),
      sale({
        id: "s2",
        passengers: [{ name: "Sem Client", passengerId: "p1", cpf: "999" }],
      }),
      sale({
        id: "s3",
        passengers: [{ name: "Fantasma", passengerId: "p9", cpf: "" }],
      }),
    ];
    const result = detectDuplicatePassengers(sales, programs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("999");
  });

  it("respeita filtro de programa/dono e ignora fora do ciclo", () => {
    const passenger = { name: "Filtro", passengerId: "p1", cpf: "111", clientId: "cli1" };
    const sales = [
      sale({ id: "s1", passengers: [passenger] }),
      sale({ id: "s2", ownerName: "Bruno", passengers: [passenger] }),
      sale({
        id: "s3",
        program: "Inexistente",
        passengers: [passenger],
      }),
      sale({
        id: "s4",
        passengers: [passenger],
        date: `${currentYear - 1}-04-01`,
      }),
    ];
    // Sem filtro: s1 + s2 formam duplicado (s3 sem programa, s4 fora do ciclo)
    expect(detectDuplicatePassengers(sales, programs)).toHaveLength(1);
    // Filtrando por dona Ana: só s1 resta
    expect(detectDuplicatePassengers(sales, programs, { ownerName: "Ana" })).toEqual([]);
  });
});
