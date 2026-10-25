import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaleSimulator, StockItem } from "@/components/SaleSimulator";

const mockStockInfo: StockItem[] = [
  {
    accountId: "acc-1",
    ownerName: "João",
    accountName: "Livelo João",
    averageCostPerMile: 0.015,
  },
  {
    accountId: "acc-2",
    ownerName: "Maria",
    accountName: "Smiles Maria",
    averageCostPerMile: 0.018,
  },
];

describe("SaleSimulator Component", () => {
  it("renders correctly when open", () => {
    render(
      <SaleSimulator open={true} onOpenChange={vi.fn()} stockInfo={mockStockInfo} />,
    );

    expect(screen.getByText("Simulador de Venda")).toBeTruthy();
    expect(screen.getByLabelText("Milhas")).toBeTruthy();
    expect(screen.getByLabelText("Preço por Milha (R$)")).toBeTruthy();
    expect(screen.getByLabelText("Custo por Milha (R$)")).toBeTruthy();
    expect(screen.getByLabelText("Custo Adicional (R$)")).toBeTruthy();
  });

  it("calculates and displays simulation results when inputs are provided", () => {
    render(
      <SaleSimulator open={true} onOpenChange={vi.fn()} stockInfo={mockStockInfo} />,
    );

    const milesInput = screen.getByLabelText("Milhas");
    const priceInput = screen.getByLabelText("Preço por Milha (R$)");
    const costInput = screen.getByLabelText("Custo por Milha (R$)");

    fireEvent.change(milesInput, { target: { value: "10000" } });
    fireEvent.change(priceInput, { target: { value: "0.02" } });
    fireEvent.change(costInput, { target: { value: "0.01" } });

    // SaleValue = 10000 * 0.02 = 200
    // TotalCost = 10000 * 0.01 = 100
    // Profit = 200 - 100 = 100
    // Margin = (100 / 200) * 100 = 50%
    // ROI = (100 / 100) * 100 = 100%
    expect(screen.getByText("Resultado da Simulação:")).toBeTruthy();
    expect(screen.getByText("R$ 200.00")).toBeTruthy();
    expect(screen.getByText("R$ 100.00")).toBeTruthy();
    expect(screen.getByText("+R$ 100.00")).toBeTruthy();
    expect(screen.getByText("50.0%")).toBeTruthy();
    expect(screen.getByText("100.0%")).toBeTruthy();
  });

  it("shows placeholder message when miles > 0 but price is missing", () => {
    render(
      <SaleSimulator open={true} onOpenChange={vi.fn()} stockInfo={mockStockInfo} />,
    );

    const milesInput = screen.getByLabelText("Milhas");
    fireEvent.change(milesInput, { target: { value: "5000" } });

    expect(
      screen.getByText("Preencha o preço por milha para ver os resultados"),
    ).toBeTruthy();
  });
});
