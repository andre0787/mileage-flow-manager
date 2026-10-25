import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SaleFormProfitPreview } from "@/components/sales/form/SaleFormProfitPreview";

describe("SaleFormProfitPreview", () => {
  it("renders nothing when profitPreview is null", () => {
    const { container } = render(
      <SaleFormProfitPreview profitPreview={null} additionalCostsTotal={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders profit calculations correctly", () => {
    const profitPreview = {
      costTotal: 1000,
      profit: 250,
      margin: 25,
    };

    render(<SaleFormProfitPreview profitPreview={profitPreview} additionalCostsTotal={50} />);

    expect(screen.getByText("Cálculo de Lucro:")).toBeInTheDocument();
    expect(screen.getByText("R$ 1000.00")).toBeInTheDocument();
    expect(screen.getByText("Custos adicionais:")).toBeInTheDocument();
    expect(screen.getByText("R$ 50.00")).toBeInTheDocument();
    expect(screen.getByText("R$ 250.00")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });
});
