import { describe, it, expect } from "vitest";
import {
  isJunkOrigemTypeName,
  dedupeOrigemTypes,
  filterToCleanOrigemTypes,
} from "@/lib/origemTypes";

describe("isJunkOrigemTypeName", () => {
  it("marca null e undefined como sujeira", () => {
    expect(isJunkOrigemTypeName(null)).toBe(true);
    expect(isJunkOrigemTypeName(undefined)).toBe(true);
  });

  it("marca vazio e whitespace como sujeira", () => {
    expect(isJunkOrigemTypeName("")).toBe(true);
    expect(isJunkOrigemTypeName("   ")).toBe(true);
  });

  it("marca padrões óbvios de teste/sujeira", () => {
    expect(isJunkOrigemTypeName("n/a")).toBe(true);
    expect(isJunkOrigemTypeName("N/A")).toBe(true);
    expect(isJunkOrigemTypeName("teste")).toBe(true);
    expect(isJunkOrigemTypeName("e2e_1234")).toBe(true);
    expect(isJunkOrigemTypeName("Teste E2E")).toBe(true);
    expect(isJunkOrigemTypeName("lixo")).toBe(true);
  });

  it("aceita nomes legítimos", () => {
    expect(isJunkOrigemTypeName("Compra Direta")).toBe(false);
    expect(isJunkOrigemTypeName("Clube Fidelidade")).toBe(false);
    expect(isJunkOrigemTypeName("Transferência")).toBe(false);
    expect(isJunkOrigemTypeName("Cartão de Crédito")).toBe(false);
  });

  it("não marca strings contendo 'a' como n/a (não confunde 'na' dentro de palavra)", () => {
    expect(isJunkOrigemTypeName("Nacional")).toBe(false);
  });
});

describe("dedupeOrigemTypes", () => {
  it("remove duplicatas case-insensitive mantendo primeira", () => {
    const items = [
      { id: "1", name: "Transferência" },
      { id: "2", name: "transferência" },
      { id: "3", name: "Compra Direta" },
    ];
    const result = dedupeOrigemTypes(items);
    expect(result.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("não muta o array original", () => {
    const items = [{ id: "1", name: "A" }, { id: "2", name: "a" }];
    dedupeOrigemTypes(items);
    expect(items).toHaveLength(2);
  });
});

describe("filterToCleanOrigemTypes", () => {
  it("remove sujeira e duplicatas em uma passada", () => {
    const items = [
      { id: "1", name: "Compra Direta" },
      { id: "2", name: "" },
      { id: "3", name: "teste" },
      { id: "4", name: "compra direta" },
      { id: "5", name: "Transferência" },
      { id: "6", name: "n/a" },
    ];
    const result = filterToCleanOrigemTypes(items);
    expect(result.map((i) => i.name)).toEqual(["Compra Direta", "Transferência"]);
  });
});