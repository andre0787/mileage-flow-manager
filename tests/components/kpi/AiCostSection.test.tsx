import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiCostSection } from "../../../src/components/kpi/AiCostSection";
import type { AiTelemetryRecord } from "../../../src/lib/aiTelemetry";

const records: AiTelemetryRecord[] = [
  {
    id: "1",
    user_id: "u1",
    session_id: "s1",
    area: "vendas",
    tokens_used: 2000,
    prompt_tokens_saved_by_pruning: 0,
    total_execution_time_ms: 2000,
    cost_estimate: 0.006,
    success_rate: 1,
    created_at: "2026-08-14T00:00:00.000Z",
  },
  {
    id: "2",
    user_id: "u1",
    session_id: "s2",
    area: "contas",
    tokens_used: 1000,
    prompt_tokens_saved_by_pruning: 0,
    total_execution_time_ms: 10000,
    cost_estimate: 0.003,
    success_rate: 0.5,
    created_at: "2026-08-14T01:00:00.000Z",
  },
];

describe("AiCostSection", () => {
  it("renderiza título e agrega custo por área", () => {
    render(<AiCostSection records={records} />);
    expect(screen.getByText("Custo por Funcionalidade")).toBeTruthy();
    expect(screen.getByText("vendas")).toBeTruthy();
    expect(screen.getByText("contas")).toBeTruthy();
    expect(screen.getByText("$0.00900")).toBeTruthy(); // total 0.006+0.003
  });

  it("mostra empty state sem registros", () => {
    render(<AiCostSection records={[]} />);
    expect(screen.getByText("Sem registros de telemetria")).toBeTruthy();
    expect(screen.getByText(/telemetry:record/)).toBeTruthy();
  });
});
