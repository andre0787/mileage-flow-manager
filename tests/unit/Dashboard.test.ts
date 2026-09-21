import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Dashboard from "@/pages/Dashboard";

const mockData = {
  owners: [],
  accounts: [],
  programs: [],
  sales: [],
  entries: [],
  origemTypes: [],
  isLoading: false,
};

vi.mock("@/contexts/DataContext", () => ({
  useData: () => mockData,
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza abas Milhas/Pontos com dados vazios", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(screen.getByText("Milhas")).toBeTruthy();
    expect(screen.getByText("Pontos")).toBeTruthy();
    expect(screen.getByText("Todos")).toBeTruthy();
  });

  it("exibe estado vazio de vendas", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(screen.getByText("Nenhuma venda registrada")).toBeTruthy();
  });

  it("mostra skeleton enquanto isLoading", () => {
    mockData.isLoading = true;
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
    mockData.isLoading = false;
  });

  it("bug #544: subtrai vendas vinculadas a contas de pontos no saldo das contas de pontos", () => {
    const accountPontos = {
      id: "acc-p1",
      name: "Conta Livelo",
      type: "pontos",
      ownerId: "ow-1",
      programId: "pr-1",
      balance: 7000,
      totalInvested: 350,
      status: "ativa",
      createdAt: "2026-01-01",
    };
    const entryPontos = {
      id: "e-p1",
      accountId: "acc-p1",
      amount: 10000,
      amountPaid: 500,
      milesGenerated: 10000,
      date: "2026-01-01",
      entryStatus: "confirmado",
    };
    const salePontos = {
      id: "s-p1",
      accountId: "acc-p1",
      milesUsed: 3000,
      saleValue: 200,
      profit: 50,
      status: "concluido",
      date: "2026-01-02",
      passengers: [],
    };

    mockData.accounts = [accountPontos] as any;
    mockData.entries = [entryPontos] as any;
    mockData.sales = [salePontos] as any;

    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );

    // No dashboard, a aba Pontos calcula saldo = 10000 entradas - 3000 vendas = 7000 pontos.
    // O total exibido em estoque para Pontos deve ser 7.000 pontos (não 10.000).
    expect(screen.getByText("7.000")).toBeTruthy();

    // Reset mockData
    mockData.accounts = [];
    mockData.entries = [];
    mockData.sales = [];
  });
});
