import { describe, expect, it, vi } from "vitest";
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

describe("cancelVenda performance benchmark", () => {
  it("measures insert call count and execution time when reversing multiple credit movements", async () => {
    const NUM_REVERSALS = 20;

    const mockCreditMoves = Array.from({ length: NUM_REVERSALS }, (_, i) => ({
      id: `mov-${i}`,
      user_id: "user-1",
      client_id: "client-1",
      sale_id: "sale-1",
      kind: i % 2 === 0 ? "earn" : "spend",
      amount: 100,
      reversal_of: null,
      created_at: new Date().toISOString(),
    }));

    let insertCalls = 0;
    const insertedPayloads: unknown[] = [];

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
                    account_id: null,
                    status: "pendente",
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      if (table === "sale_status_history") {
        return {
          insert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "client_credit_movements") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: mockCreditMoves, error: null }),
          }),
          insert: (payload: unknown) => {
            insertCalls++;
            insertedPayloads.push(payload);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {};
    });

    const start = performance.now();
    const store = makeStore();
    const result = await store.dispatch(vendasApi.endpoints.cancelVenda.initiate("sale-1"));
    const duration = performance.now() - start;

    expect(result.data).toBeNull();
    const insertedRecords = insertedPayloads.flatMap((p) => (Array.isArray(p) ? p : [p]));
    console.log(
      `[Optimized Benchmark] client_credit_movements insert calls: ${insertCalls}, Duration: ${duration.toFixed(2)}ms, Inserted records: ${insertedRecords.length}`,
    );
    expect(insertCalls).toBe(1);
    expect(insertedRecords).toHaveLength(NUM_REVERSALS);
  });
});
