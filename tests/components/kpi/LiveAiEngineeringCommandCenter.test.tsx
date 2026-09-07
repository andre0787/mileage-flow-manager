import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Supabase mockável por teste (padrão do AiCostSection.test): o limit()
// retorna uma Promise real — o componente usa use()/Suspense em cima dela.
vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from "@/lib/supabase";
const fromMock = vi.mocked(supabase.from);

function mockSupabaseResult(result: { data: unknown[] | null } | Error) {
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnValue(
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve({ data: result.data, error: null }),
    ),
  } as never);
}

const rows = [
  {
    id: "evt-1",
    event_type: "agent.completed",
    created_at: "2026-09-07T00:00:00.000Z",
    agent_role: "reviewer",
    agent_adapter: "pi",
    total_execution_time_ms: 100,
    tokens_used: 1000,
    success_rate: 1,
  },
];

describe("LiveAiEngineeringCommandCenter ao vivo (use() + Suspense)", () => {
  // A promise do resource é cacheada em escopo de módulo — recarregamos o
  // módulo por teste (resetModules + import dinâmico) para isolar o cache.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o command center com telemetria carregada", async () => {
    mockSupabaseResult({ data: rows });
    const { default: LiveCenter } = await import(
      "@/components/kpi/LiveAiEngineeringCommandCenter"
    );
    await act(async () => {
      render(
        <Suspense fallback={<div>carregando</div>}>
          <LiveCenter />
        </Suspense>,
      );
    });
    expect(
      screen.getByText("🤖 AI Engineering Command Center"),
    ).toBeTruthy();
    expect(screen.getByText("Agent Performance")).toBeTruthy();
  });

  it("Supabase falha → fallback estático (fail-open)", async () => {
    mockSupabaseResult(new Error("network"));
    const { default: LiveCenter } = await import(
      "@/components/kpi/LiveAiEngineeringCommandCenter"
    );
    await act(async () => {
      render(
        <Suspense fallback={<div>carregando</div>}>
          <LiveCenter />
        </Suspense>,
      );
    });
    expect(
      screen.getByText("🤖 AI Engineering Command Center"),
    ).toBeTruthy();
  });
});

// Suspense precisa vir depois do mock (hoisting do vi.mock reordena imports).
import { Suspense } from "react";
