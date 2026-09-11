import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransferForm } from "@/components/TransferForm";
import type { Account, OrigemType, Program, Owner } from "@/types";

const mockOrigemTypes: OrigemType[] = [
  {
    id: "transfer-1",
    name: "Transferência",
    accountType: "milhas",
    color: "#8b5cf6",
    description: "{}",
  },
];

const mockAccounts: Account[] = [
  {
    id: "pt-1",
    ownerId: "owner-1",
    programId: "prog-pt",
    name: "Conta Pontos",
    type: "pontos",
    balance: 100000,
    totalInvested: 5000,
    averageCostPerMile: 0.05,
    status: "ativa",
  },
  {
    id: "mi-1",
    ownerId: "owner-1",
    programId: "prog-mi",
    name: "Conta Milhas",
    type: "milhas",
    balance: 0,
    totalInvested: 0,
    averageCostPerMile: 0,
    status: "ativa",
  },
];

const mockOwners: Owner[] = [
  { id: "owner-1", name: "Dono Teste", cpf: "111.222.333-44" },
];

const mockPrograms: Program[] = [
  { id: "prog-pt", name: "Programa Pontos", type: "pontos" },
  { id: "prog-mi", name: "Programa Milhas", type: "milhas" },
];

describe("TransferForm", () => {
  it("atualiza cálculos automáticos ao inserir valor investido no carrinho (cartCost)", () => {
    render(
      <TransferForm
        mode="create"
        initialData={{ sourceAccountId: "pt-1", accountId: "mi-1" }}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Seleciona Pontos Transferidos: 50000
    const amountInput = screen.getByPlaceholderText("Ex: 100000");
    fireEvent.change(amountInput, { target: { value: "50000" } });

    // Custo calculado da transferência: 50000 * 0.05 = 2500 -> custo por milhar = 2500/50000*1000 = R$ 50.00
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument();

    // Insere o valor investido do carrinho (cartCost = 200) sem pontos extras
    const cartCostInput = screen.getByPlaceholderText("Ex: 200.00");
    fireEvent.change(cartCostInput, { target: { value: "200" } });

    // Novo custo total = 2500 + 200 = 2700
    // Custo por milhar = 2700 / 50000 * 1000 = R$ 54.00
    expect(screen.getByText("R$ 54.00")).toBeInTheDocument();
  });
});
