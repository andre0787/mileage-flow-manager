import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPITable from "../../src/components/KPITable";

describe("KPITable", () => {
  const headers = ["Mês", "Valor"];
  const rows = [
    ["2026-07", "85.7"],
    ["2026-06", "72.3"],
  ];

  it("renders headers and rows", () => {
    render(<KPITable title="Test Table" headers={headers} rows={rows} />);
    expect(screen.getByText("2026-07")).toBeDefined();
    expect(screen.getByText("2026-06")).toBeDefined();
    expect(screen.getByText("85.7")).toBeDefined();
    expect(screen.getByText("72.3")).toBeDefined();
  });

  it("shows title", () => {
    render(<KPITable title="⏱️ Tempo de Ciclo" headers={headers} rows={rows} />);
    expect(screen.getByText("⏱️ Tempo de Ciclo")).toBeDefined();
  });

  it("shows empty message when no rows", () => {
    render(<KPITable title="Empty" headers={headers} rows={[]} />);
    expect(screen.getByText(/nenhum dado/i)).toBeDefined();
  });
});