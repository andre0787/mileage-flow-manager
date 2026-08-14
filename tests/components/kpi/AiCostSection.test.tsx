import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AiCostSection } from "../../../src/components/kpi/AiCostSection";
import type { AiTelemetryRecord } from "../../../src/lib/aiTelemetry";

// Supabase mockável por teste (padrão do KPIDashboard.test): o limit() retorna
// uma Promise real — o componente usa use()/Promise.resolve em cima dela.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from "@/lib/supabase";
const fromMock = vi.mocked(supabase.from);

function mockSupabaseResult(result: { data: AiTelemetryRecord[] | null } | Error) {
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue(
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve({ data: result.data, error: null }),
    ),
  });
}

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
  it("renderiza título e agrega custo por área (override síncrono)", () => {
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

describe("AiCostSection ao vivo (use() + Suspense)", () => {
  // A promise do resource é cacheada em escopo de módulo — recarregamos o
  // módulo por teste (resetModules + import dinâmico) para isolar o cache.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolve via use() e agrega custo por área", async () => {
    mockSupabaseResult({ data: records });
    const { AiCostSection: Section } = await import(
      "../../../src/components/kpi/AiCostSection"
    );
    await act(async () => {
      render(<Section />);
    });
    expect(screen.getByText("vendas")).toBeTruthy();
    expect(screen.getByText("$0.00900")).toBeTruthy();
  });

  it("falha do Supabase → empty state (fail-open, nunca rejeita)", async () => {
    mockSupabaseResult(new Error("network"));
    const { AiCostSection: Section } = await import(
      "../../../src/components/kpi/AiCostSection"
    );
    await act(async () => {
      render(<Section />);
    });
    expect(screen.getByText("Sem registros de telemetria")).toBeTruthy();
  });

  it("supabase retorna null → empty state", async () => {
    mockSupabaseResult({ data: null });
    const { AiCostSection: Section } = await import(
      "../../../src/components/kpi/AiCostSection"
    );
    await act(async () => {
      render(<Section />);
    });
    expect(screen.getByText("Sem registros de telemetria")).toBeTruthy();
  });
});
