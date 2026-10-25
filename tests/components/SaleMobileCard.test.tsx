import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaleMobileCard } from "@/components/sales/SaleMobileCard";
import type { Sale } from "@/types";

vi.mock("@/features/clientes/hooks", () => ({
  useClientBalanceQuery: () => ({
    balance: 100,
    movements: [{ saleId: "sale-1", amount: 50 }],
    data: [],
    isPending: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

const mockSale: Sale = {
  id: "sale-1",
  date: "2025-01-15",
  ownerName: "João",
  program: "Smiles",
  clientId: "client-1",
  clientName: "Maria Silva",
  ticketLocator: "LOC123",
  milesUsed: 50000,
  costPerThousand: 15.5,
  totalCost: 775,
  pricePerThousand: 22.0,
  saleValue: 1100,
  amountReceived: 500,
  profit: 325,
  profitMargin: 29.54,
  status: "pendente",
  passengers: [{ name: "Maria Silva" }],
  createdAt: "2025-01-15T10:00:00Z",
};

const mockServiceSale: Sale = {
  id: "sale-2",
  date: "2025-01-16",
  ownerName: "Ana",
  kind: "servico",
  serviceType: "consultoria",
  clientId: "client-2",
  clientName: "Carlos Souza",
  milesUsed: 0,
  costPerThousand: 0,
  totalCost: 0,
  pricePerThousand: 0,
  saleValue: 200,
  amountReceived: 0,
  profit: 200,
  profitMargin: 100,
  status: "pago",
  passengers: [],
  observations: "Serviço VIP",
  createdAt: "2025-01-16T10:00:00Z",
};

describe("SaleMobileCard", () => {
  const onCancelClick = vi.fn();
  const onStatusChange = vi.fn();
  const onReceive = vi.fn();
  const onRefund = vi.fn();
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os detalhes de uma venda de milhas", () => {
    render(
      <SaleMobileCard
        sale={mockSale}
        onCancelClick={onCancelClick}
        onStatusChange={onStatusChange}
        onReceive={onReceive}
        onRefund={onRefund}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText("Smiles")).toBeDefined();
    expect(screen.getByText("Maria Silva")).toBeDefined();
    expect(screen.getByText("Localizador: LOC123")).toBeDefined();
    expect(screen.getByText("1 pax")).toBeDefined();
    expect(screen.getByText("Receber")).toBeDefined();
    expect(screen.getByText("Devolver")).toBeDefined();
    expect(screen.getByText("Editar")).toBeDefined();
    expect(screen.getByText("Cancelar")).toBeDefined();
  });

  it("renderiza detalhes de uma venda de serviço com observações", () => {
    render(
      <SaleMobileCard
        sale={mockServiceSale}
        onCancelClick={onCancelClick}
      />
    );

    expect(screen.getByText("Consultoria")).toBeDefined();
    expect(screen.getByText("Carlos Souza")).toBeDefined();
    expect(screen.getByText("Obs: Serviço VIP")).toBeDefined();
    expect(screen.getByText("Serviço")).toBeDefined();
  });

  it("chama onCancelClick ao clicar em Cancelar", () => {
    render(
      <SaleMobileCard
        sale={mockSale}
        onCancelClick={onCancelClick}
      />
    );

    fireEvent.click(screen.getByText("Cancelar"));
    expect(onCancelClick).toHaveBeenCalledWith("sale-1");
  });

  it("chama onEdit ao clicar em Editar", () => {
    render(
      <SaleMobileCard
        sale={mockSale}
        onEdit={onEdit}
        onCancelClick={onCancelClick}
      />
    );

    fireEvent.click(screen.getByText("Editar"));
    expect(onEdit).toHaveBeenCalledWith(mockSale);
  });

  it("renderiza estado cancelado sem botões de ação", () => {
    const cancelledSale: Sale = { ...mockSale, status: "cancelado" };
    render(
      <SaleMobileCard
        sale={cancelledSale}
        onCancelClick={onCancelClick}
        onReceive={onReceive}
      />
    );

    expect(screen.getByText("Cancelado")).toBeDefined();
    expect(screen.queryByText("Receber")).toBeNull();
    expect(screen.queryByText("Cancelar")).toBeNull();
  });
});
