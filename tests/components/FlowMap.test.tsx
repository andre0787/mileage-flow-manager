import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FlowMap } from "../../src/components/FlowMap";

describe("FlowMap", () => {
  it("renders with default title and formatted values", () => {
    render(
      <FlowMap
        totalMiles={150000}
        activeAccounts={5}
        totalSoldMiles={50000}
        totalRevenue={1250}
        ownersCount={2}
      />
    );

    expect(screen.getByText("Fluxo de Milhas")).toBeDefined();
    expect(screen.getByText("2 proprietários ativos")).toBeDefined();
    expect(screen.getByText("FLUXO ATIVO")).toBeDefined();

    expect(screen.getAllByText("150.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 1.250").length).toBeGreaterThan(0);
  });

  it("renders with custom title and unitLabel", () => {
    render(
      <FlowMap
        totalMiles={80000}
        activeAccounts={3}
        totalSoldMiles={20000}
        totalRevenue={500}
        ownersCount={1}
        unitLabel="Pontos"
        title="Fluxo Geral de Pontos"
      />
    );

    expect(screen.getByText("Fluxo Geral de Pontos")).toBeDefined();
    expect(screen.getByText("1 proprietário ativo")).toBeDefined();
    expect(screen.getAllByText("Pontos em Estoque").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pontos Vendidas").length).toBeGreaterThan(0);
  });
});
