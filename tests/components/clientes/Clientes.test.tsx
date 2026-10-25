import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Clientes from "@/pages/Clientes";

// Mock data and context hooks
vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    clients: [
      {
        id: "cli-1",
        name: "João Silva",
        cpf: "111.111.111-11",
        email: "joao@example.com",
        phone: "(11) 99999-9999",
        telegram: "@joao",
        totalPurchases: 3,
        usageHistory: [{ program: "Smiles", count: 2 }],
      },
      {
        id: "cli-2",
        name: "Maria Santos",
        cpf: "222.222.222-22",
        email: "maria@example.com",
        phone: "(11) 88888-8888",
        telegram: "@maria",
        totalPurchases: 0,
        usageHistory: [],
      },
    ],
    sales: [],
    isLoading: false,
  }),
}));

vi.mock("@/features/clientes/hooks", () => ({
  useClientBalanceQuery: () => ({
    balance: 150.0,
    movements: [],
  }),
}));

vi.mock("@/hooks/useDatabase", () => ({
  useAddClientMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useAddClientAdvanceMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateClientMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteClientMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateClientCreditDateMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("Clientes Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders clients page with metrics and table rows", () => {
    render(<Clientes />);

    expect(screen.getByRole("heading", { name: "Clientes", level: 1 })).toBeDefined();
    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Maria Santos").length).toBeGreaterThan(0);
    expect(screen.getByText("Total de Clientes")).toBeDefined();
    expect(screen.getByText("Clientes Ativos")).toBeDefined();
  });

  it("filters clients by search term", () => {
    render(<Clientes />);

    const searchInput = screen.getByPlaceholderText("Buscar por nome, CPF ou e-mail...");
    fireEvent.change(searchInput, { target: { value: "João" } });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
    expect(screen.queryByText("Maria Santos")).toBeNull();
  });

  it("opens create client drawer on button click", () => {
    render(<Clientes />);

    const createButton = screen.getByRole("button", { name: /Novo Cliente/i });
    fireEvent.click(createButton);

    expect(screen.getByText("Cadastrar Novo Cliente")).toBeDefined();
  });
});
