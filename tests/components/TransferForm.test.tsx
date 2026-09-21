import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransferForm } from "@/components/TransferForm";
import type { Account, OrigemType, Program, Owner } from "@/types";

const mockOrigemTypes: OrigemType[] = [
  {
    id: "ot-transf",
    name: "Transferência",
    accountType: "milhas",
    color: "#8b5cf6",
    description: JSON.stringify({ hasRecurrence: false }),
  },
];

const mockAccounts: Account[] = [
  {
    id: "acc-pts",
    ownerId: "owner-1",
    programId: "prog-pts",
    name: "Conta Pontos",
    type: "pontos",
    balance: 100000,
    totalInvested: 5000,
    averageCostPerMile: 0.05,
    status: "ativa",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "acc-mls",
    ownerId: "owner-1",
    programId: "prog-mls",
    name: "Conta Milhas",
    type: "milhas",
    balance: 0,
    totalInvested: 0,
    averageCostPerMile: 0,
    status: "ativa",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPrograms: Program[] = [
  {
    id: "prog-pts",
    name: "Programa Pontos",
    type: "pontos",
    maxPassengers: 9,
    passengerCycleType: "anual",
    passengerCycleDays: 365,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prog-mls",
    name: "Programa Milhas",
    type: "milhas",
    maxPassengers: 9,
    passengerCycleType: "anual",
    passengerCycleDays: 365,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockOwners: Owner[] = [
  {
    id: "owner-1",
    name: "Dono Teste",
    cpf: "111.222.333-44",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("TransferForm Component", () => {
  it("atualiza o custo por milhar e custo total quando cartCost é inserido", () => {
    render(
      <TransferForm
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        initialData={{
          sourceAccountId: "acc-pts",
          accountId: "acc-mls",
          amount: "50000",
          amountPaid: "2500",
          bonusPercent: "30",
          cartAmount: "10000",
          date: "2026-08-05",
        }}
      />,
    );

    // Sem cartCost: totalPaid = 2500, milhas = 78000 -> 2500 / 78000 * 1000 ≈ 32.05
    expect(screen.getByText("R$ 32.05")).toBeInTheDocument();

    // Insere o valor do carrinho
    const cartCostInput = screen.getByPlaceholderText("Ex: 200.00");
    fireEvent.change(cartCostInput, { target: { value: "200" } });

    // Custo total = 2500 + 200 = 2700 -> custo/milhar = 34.62, custo/milha = 0.0346, total = 2700.00
    expect(screen.getByText("R$ 34.62")).toBeInTheDocument();
    expect(screen.getByText("R$ 0.0346")).toBeInTheDocument();
    expect(screen.getByText("Total: R$ 2700.00")).toBeInTheDocument();
  });

  it("calcula custo base a partir do custo médio da conta quando amountPaid não está na initialData", () => {
    render(
      <TransferForm
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        initialData={{
          sourceAccountId: "acc-pts",
          accountId: "acc-mls",
          amount: "50000",
          bonusPercent: "30",
          cartAmount: "10000",
          date: "2026-08-05",
        }}
      />,
    );

    // Custo calculado: 50000 * 0.05 = 2500. Milhas: 78000. Custo/milhar ≈ 32.05
    expect(screen.getByText("R$ 32.05")).toBeInTheDocument();

    const cartCostInput = screen.getByPlaceholderText("Ex: 200.00");
    fireEvent.change(cartCostInput, { target: { value: "200" } });

    expect(screen.getByText("R$ 34.62")).toBeInTheDocument();
    expect(screen.getByText("R$ 0.0346")).toBeInTheDocument();
    expect(screen.getByText("Total: R$ 2700.00")).toBeInTheDocument();
  });

  it("exibe detalhamento mesmo se cartAmount for 0 mas cartCost for informado", () => {
    render(
      <TransferForm
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        accounts={mockAccounts}
        origemTypes={mockOrigemTypes}
        programs={mockPrograms}
        owners={mockOwners}
        initialData={{
          sourceAccountId: "acc-pts",
          accountId: "acc-mls",
          amount: "50000",
          amountPaid: "2500",
          bonusPercent: "0",
          cartAmount: "0",
          date: "2026-08-05",
        }}
      />,
    );

    const cartCostInput = screen.getByPlaceholderText("Ex: 200.00");
    fireEvent.change(cartCostInput, { target: { value: "200" } });

    expect(screen.getByText("Carrinho: R$ 200.00")).toBeInTheDocument();
    expect(screen.getByText("Total: R$ 2700.00")).toBeInTheDocument();
  });
});
