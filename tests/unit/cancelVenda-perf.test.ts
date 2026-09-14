import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { vendasApi } from "@/features/vendas/vendasApi";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("cancelVenda — performance & batching benchmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("performs a single bulk insert for credit reversals instead of N individual calls", async () => {
    const N = 20;
    const creditMoves = Array.from({ length: N }, (_, i) => ({
      id: `mov-${i}`,
      user_id: "user-1",
      client_id: "client-1",
      sale_id: "sale-1",
      kind: i % 2 === 0 ? "earn" : "spend",
      amount: 100,
    }));

    const insertMock = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2));
      return { error: null };
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: "sale-1",
                    user_id: "user-1",
                    client_id: "client-1",
                    status: "pendente",
                  },
                  error: null,
                }),
            }),
          }),
          update: updateMock,
        };
      }
      if (table === "client_credit_movements") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: creditMoves, error: null }),
          }),
          insert: insertMock,
        };
      }
      if (table === "sale_status_history") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    const start = performance.now();
    const result = await makeStore().dispatch(vendasApi.endpoints.cancelVenda.initiate("sale-1"));
    const duration = performance.now() - start;

    expect(result.data).toBeNull();
    expect(duration).toBeGreaterThan(0);

    // After optimization, insert call count for reversals should be exactly 1
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock.mock.calls[0][0]).toHaveLength(N);
  });
});
