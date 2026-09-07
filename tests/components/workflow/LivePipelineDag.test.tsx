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
    agent_role: "implementer",
    success_rate: 1,
  },
];

describe("LivePipelineDag ao vivo (use() + Suspense)", () => {
  // A promise do resource é cacheada em escopo de módulo — recarregamos o
  // módulo por teste (resetModules + import dinâmico) para isolar o cache.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza o DAG com os envelopes carregados", async () => {
    mockSupabaseResult({ data: rows });
    const { default: LivePipelineDag } = await import(
      "@/components/workflow/LivePipelineDag"
    );
    await act(async () => {
      render(
        <Suspense fallback={<div>carregando</div>}>
          <LivePipelineDag />
        </Suspense>,
      );
    });
    expect(screen.getByText("Pipeline real (DAG)")).toBeTruthy();
    expect(screen.getByText(/envelopes §19 · clique num node/)).toBeTruthy();
    expect(screen.getByText("TASK")).toBeTruthy();
    expect(screen.getByText("RESULT")).toBeTruthy();
  });

  it("Supabase falha → fallback com dados estáticos (fail-open)", async () => {
    mockSupabaseResult(new Error("network"));
    const { default: LivePipelineDag } = await import(
      "@/components/workflow/LivePipelineDag"
    );
    await act(async () => {
      render(
        <Suspense fallback={<div>carregando</div>}>
          <LivePipelineDag />
        </Suspense>,
      );
    });
    expect(screen.getByText("Pipeline real (DAG)")).toBeTruthy();
  });
});

// Suspense precisa vir depois do mock (hoisting do vi.mock reordena imports).
import { Suspense } from "react";
