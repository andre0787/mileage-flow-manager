import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { BusinessBreakdown } from "@/components/kpi/BusinessBreakdown";

describe("BusinessBreakdown", () => {
  it("renderiza estoque por dono e saldo por programa", () => {
    render(
      createElement(BusinessBreakdown, {
        owners: [
          { name: "Ana", totalMiles: 150000, totalInvested: 7000, cpfCount: 2 },
          { name: "Beto", totalMiles: 20000, totalInvested: 800, cpfCount: 0 },
        ],
        programs: [
          { name: "Smiles", balance: 100000 },
          { name: "Latam Pass", balance: 50000 },
        ],
      }),
    );

    expect(screen.getByText("👤 Estoque por dono")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByText("150.000 milhas")).toBeTruthy();
    expect(screen.getByText("R$ 7.000 · 2 CPFs usados")).toBeTruthy();
    expect(screen.getByText("🏦 Saldo por programa")).toBeTruthy();
    expect(screen.getByText("Smiles")).toBeTruthy();
  });

  it("mostra mensagem quando não há dados", () => {
    render(createElement(BusinessBreakdown, { owners: [], programs: [] }));
    expect(screen.getByText("Sem donos com estoque.")).toBeTruthy();
    expect(screen.getByText("Sem saldo por programa.")).toBeTruthy();
  });
});
