import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkflowMetrics } from "@/hooks/useWorkflowMetrics";

const workflow = {
  generatedAt: "2026-08-22T00:00:00Z",
  dataDate: "2026-08-22",
  kpiStats: [],
  eventTypes: [],
  grades: [],
  recentTimeline: [],
  gateEfficiency: {
    ruleFails: 1,
    healed: 0,
    healedRate: 0,
    prePrTotal: 1,
    prePrPass: 1,
    prePrPassRate: 100,
    gateBlocked: 0,
    topViolations: [],
  },
  lastPrs: [],
  overview: {},
};

describe("useWorkflowMetrics", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("carrega workflow e KPI em paralelo", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const path = String(input);
      return new Response(JSON.stringify(path.includes("workflow") ? workflow : null), { status: 200 });
    });
    const { result } = renderHook(() => useWorkflowMetrics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workflow?.dataDate).toBe("2026-08-22");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("expõe refresh manual sem quebrar quando uma fonte falha", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useWorkflowMetrics());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.refresh());
    expect(result.current.workflow).not.toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
