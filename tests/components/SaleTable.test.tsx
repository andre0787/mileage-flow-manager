import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaleTable } from "@/components/SaleTable";
import type { Sale } from "@/types";

vi.mock("@/contexts/OnlineContext", () => ({
  useOnlineStatus: () => ({ isOnline: true }),
}));

// RTK Query exige <Provider>; o mock isola a tabela do store (mesmo padrão do OnlineContext).
vi.mock("@/features/clientes/hooks", () => ({
  useClientBalanceQuery: () => ({
    balance: 0,
    movements: [],
    data: [],
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useClientCreditsQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
  useClientsQuery: () => ({
    data: [],
    byId: {},
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

const mockSales: Sale[] = [
  {
    id: "sale-1",
    date: "2025-01-15",
    ownerName: "João",
    program: "Smiles",
    clientName: "Maria Silva",
    ticketLocator: "ABC123",
    milesUsed: 50000,
    costPerThousand: 15.5,
    totalCost: 775,
    pricePerThousand: 22.0,
    saleValue: 1100,
    profit: 325,
    profitMargin: 29.54,
    status: "pendente",
    passengers: [{ name: "Maria Silva" }],
    createdAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "sale-2",
    date: "2025-01-20",
    ownerName: "Ana",
    program: "TudoAzul",
    clientName: "Carlos Souza",
    ticketLocator: "XYZ789",
    milesUsed: 30000,
    costPerThousand: 18.0,
    totalCost: 540,
    pricePerThousand: 25.0,
    saleValue: 750,
    profit: 210,
    profitMargin: 28.0,
    status: "concluido",
    passengers: [{ name: "Carlos Souza" }, { name: "Ana Souza" }],
    createdAt: "2025-01-20T14:00:00Z",
  },
];

describe("SaleTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o estado vazio quando a lista de vendas está vazia", () => {
    const onCreateClick = vi.fn();
    render(<SaleTable sales={[]} onCreateClick={onCreateClick} />);

    expect(screen.getByText("Nenhuma venda encontrada")).toBeDefined();
    const newButton = screen.getByRole("button", { name: "Nova Venda" });
    expect(newButton).toBeDefined();

    fireEvent.click(newButton);
    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  it("renderiza a tabela de vendas no desktop com dados das vendas", () => {
    render(<SaleTable sales={mockSales} />);

    expect(screen.getByText("Histórico de Vendas")).toBeDefined();
    expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Carlos Souza").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("30.000").length).toBeGreaterThan(0);
  });

  it("chama onEdit ao clicar no botão Editar", () => {
    const onEdit = vi.fn();
    render(<SaleTable sales={mockSales} onEdit={onEdit} />);

    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("abre dialog de confirmação e chama onCancel ao confirmar o cancelamento", () => {
    const onCancel = vi.fn();
    render(<SaleTable sales={mockSales} onCancel={onCancel} />);

    const cancelButtons = screen.getAllByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButtons[0]);

    expect(screen.getByText("Cancelar venda?")).toBeDefined();

    const confirmButton = screen.getByRole("button", { name: "Sim, cancelar venda" });
    fireEvent.click(confirmButton);

    expect(onCancel).toHaveBeenCalledWith("sale-2");
  });

  it("permite ordenar colunas", () => {
    render(<SaleTable sales={mockSales} />);

    const clienteHeader = screen.getByText("Cliente");
    fireEvent.click(clienteHeader);

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(1);
  });
});
