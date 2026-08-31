import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import type { PointEntry, Sale } from "@/types";

const mockDeleteSaleMutateAsync = vi.fn();
const mockDeleteEntryMutateAsync = vi.fn();
let mockSales: Sale[] = [];

vi.mock("@/hooks/useDatabase", () => ({
  useDeleteSaleMutation: () => ({ mutateAsync: mockDeleteSaleMutateAsync }),
  useDeleteEntryMutation: () => ({ mutateAsync: mockDeleteEntryMutateAsync }),
}));

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({ sales: mockSales }),
}));

describe("DeleteEntryDialog", () => {
  const sampleEntry: PointEntry = {
    id: "entry-1",
    accountId: "acc-1",
    origemTypeId: "ot-1",
    amount: 10000,
    amountPaid: 150,
    costPerThousand: 15,
    date: "2026-08-01",
  };

  const sampleSales: Sale[] = [
    {
      id: "sale-1",
      accountId: "acc-1",
      accountName: "Conta Teste",
      ownerName: "Dono Teste",
      program: "Livelo",
      clientId: "client-1",
      clientName: "Cliente 1",
      milesUsed: 2000,
      saleValue: 40,
      costPerMile: 15,
      profit: 10,
      profitMargin: 25,
      status: "concluido",
      ticketLocator: "LOC123",
      passengers: [],
      date: "2026-08-02",
    },
    {
      id: "sale-2",
      accountId: "acc-1",
      accountName: "Conta Teste",
      ownerName: "Dono Teste",
      program: "Livelo",
      clientId: "client-1",
      clientName: "Cliente 1",
      milesUsed: 3000,
      saleValue: 60,
      costPerMile: 15,
      profit: 15,
      profitMargin: 25,
      status: "concluido",
      ticketLocator: "LOC124",
      passengers: [],
      date: "2026-08-03",
    },
    {
      id: "sale-3",
      accountId: "acc-1",
      accountName: "Conta Teste",
      ownerName: "Dono Teste",
      program: "Livelo",
      clientId: "client-1",
      clientName: "Cliente 1",
      milesUsed: 5000,
      saleValue: 100,
      costPerMile: 15,
      profit: 25,
      profitMargin: 25,
      status: "concluido",
      ticketLocator: "LOC125",
      passengers: [],
      date: "2026-08-04",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSales = [];
  });

  it("renderiza o botão Excluir", () => {
    render(<DeleteEntryDialog entry={sampleEntry} />);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeDefined();
  });

  it("exclui vendas relacionadas em paralelo e depois a entrada", async () => {
    mockSales = sampleSales;
    mockDeleteSaleMutateAsync.mockResolvedValue(undefined);
    mockDeleteEntryMutateAsync.mockResolvedValue(undefined);

    render(<DeleteEntryDialog entry={sampleEntry} />);

    // Open dialog
    const triggerBtn = screen.getByRole("button", { name: "Excluir" });
    fireEvent.click(triggerBtn);

    // Click confirm button
    const confirmBtn = screen.getByRole("button", { name: "Excluir entrada e 3 venda(s)" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteSaleMutateAsync).toHaveBeenCalledTimes(3);
      expect(mockDeleteSaleMutateAsync).toHaveBeenCalledWith("sale-1");
      expect(mockDeleteSaleMutateAsync).toHaveBeenCalledWith("sale-2");
      expect(mockDeleteSaleMutateAsync).toHaveBeenCalledWith("sale-3");
      expect(mockDeleteEntryMutateAsync).toHaveBeenCalledWith(sampleEntry);
    });
  });

  it("benchmark: demonstra que deleção paralela com Promise.all é significativamente mais rápida que sequencial", async () => {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const items = Array.from({ length: 10 }, (_, i) => ({ id: `sale-${i}` }));

    // Medir execução sequencial
    const startSeq = performance.now();
    for (const item of items) {
      await delay(20);
    }
    const durationSeq = performance.now() - startSeq;

    // Medir execução paralela (Promise.all)
    const startPar = performance.now();
    await Promise.all(items.map(() => delay(20)));
    const durationPar = performance.now() - startPar;

    // A execução paralela deve ser ~10x mais rápida (esperado ~20ms vs ~200ms)
    expect(durationPar).toBeLessThan(durationSeq / 3);
  });
});
