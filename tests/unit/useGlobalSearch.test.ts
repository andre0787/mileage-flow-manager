import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    entries: [
      {
        id: "e1",
        accountId: "a1",
        origemTypeId: "ot1",
        date: "2026-08-12",
        milesGenerated: 10000,
        amount: 100,
      },
    ],
    sales: [
      {
        id: "s1",
        clientName: "João Silva",
        ownerName: "Maria",
        program: "Smiles",
        ticketLocator: "ABC123",
        milesUsed: 25000,
      },
    ],
    clients: [
      {
        id: "c1",
        name: "João Silva",
        cpf: "123.456.789-00",
        phone: "11999999999",
      },
    ],
    accounts: [
      { id: "a1", name: "Conta Milhas", type: "milhas", balance: 50000 },
    ],
    programs: [],
    origemTypes: [{ id: "ot1", name: "Clube Fidelidade" }],
  }),
}));

describe("useGlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna resultados vazios quando query está vazia", () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.flatResults).toEqual([]);
  });

  it("busca por entradas e contas com match de palavra", () => {
    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery("conta");
    });

    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.flatResults.length).toBeGreaterThan(0);
  });

  it("busca por cliente", () => {
    const { result } = renderHook(() => useGlobalSearch());

    act(() => {
      result.current.setQuery("João");
    });

    const clienteResult = result.current.results.find((r) => r.type === "cliente");
    expect(clienteResult).toBeDefined();
    expect(clienteResult?.title).toBe("João Silva");
  });
});
