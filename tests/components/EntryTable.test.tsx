import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EntryTable } from "@/components/EntryTable";
import type { PointEntry, Account, OrigemType, Program, Owner } from "@/types";

vi.mock("@/components/DeleteEntryDialog", () => ({
  DeleteEntryDialog: () => <button data-testid="delete-dialog">Delete</button>,
}));

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Conta Livelo",
    ownerId: "owner-1",
    programId: "prog-1",
    type: "pontos",
    balance: 10000,
    status: "ativa",
    createdAt: "2024-01-01",
  },
];

const mockOwners: Owner[] = [
  { id: "owner-1", name: "João Silva", cpf: "", phone: "" },
];

const mockOrigemTypes: OrigemType[] = [
  { id: "orig-1", name: "Compra no Cartão", accountType: "pontos", color: "#6366f1" },
];

const mockPrograms: Program[] = [
  { id: "prog-1", name: "Livelo", type: "pontos" },
];

const mockEntries: PointEntry[] = [
  {
    id: "entry-1",
    accountId: "acc-1",
    origemTypeId: "orig-1",
    amount: 1000,
    amountPaid: 100,
    costPerMile: 0.1,
    date: "2024-05-01",
    entryStatus: "aguardando",
  },
  {
    id: "entry-2",
    accountId: "acc-1",
    origemTypeId: "orig-1",
    amount: 5000,
    amountPaid: 500,
    costPerMile: 0.1,
    date: "2024-05-02",
    entryStatus: "confirmado",
  },
];

describe("EntryTable", () => {
  it("renders entries in table mode", () => {
    render(
      <EntryTable
        type="pontos"
        entries={mockEntries}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        onEdit={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getAllByText("Conta Livelo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Compra no Cartão").length).toBeGreaterThan(0);
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const handleConfirm = vi.fn();
    render(
      <EntryTable
        type="pontos"
        entries={mockEntries}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        onEdit={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    const confirmButtons = screen.getAllByRole("button", { name: /confirmar/i });
    fireEvent.click(confirmButtons[0]);
    expect(handleConfirm).toHaveBeenCalledWith(mockEntries[0]);
  });

  it("calls onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn();
    render(
      <EntryTable
        type="pontos"
        entries={mockEntries}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        onEdit={handleEdit}
        onConfirm={vi.fn()}
      />
    );

    const editButtons = screen.getAllByRole("button", { name: /editar/i });
    fireEvent.click(editButtons[0]);
    expect(handleEdit).toHaveBeenCalled();
  });

  it("renders empty state when entries list is empty", () => {
    render(
      <EntryTable
        type="pontos"
        entries={[]}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        onEdit={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Nenhuma entrada de pontos/i).length).toBeGreaterThan(0);
  });
});
