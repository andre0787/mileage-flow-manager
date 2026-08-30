import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "@/features/entradas/entradasApi";
import type { PointEntry } from "@/types";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const makeRecurringEntry = (): PointEntry => ({
  id: "entry-1",
  accountId: "acc-1",
  origemTypeId: "origem-1",
  amount: 1000,
  amountPaid: 50,
  costPerThousand: 20,
  conversionRate: 1,
  milesGenerated: 1000,
  costPerMile: 0.05,
  sourceAccountId: null,
  bonusPercent: null,
  description: null,
  date: "2026-01-01",
  entryStatus: "confirmada",
  recurrenceInterval: 30,
  recurrenceEnd: "2026-12-31",
  recurrenceDayOfMonth: 1,
  recurrenceValueMode: null,
  parentEntryId: null,
  cartAmount: null,
  cartCost: null,
});

function makeStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("addEntry Endpoint — Performance & Bulk Insertion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("performs 1 single bulk insert call for recurring entries instead of N individual calls", async () => {
    let insertCallCount = 0;
    const insertedPayloads: unknown[] = [];
    const insertFn = vi.fn().mockImplementation((payload) => {
      insertCallCount++;
      insertedPayloads.push(payload);
      return Promise.resolve({ error: null });
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "entries") {
        return { insert: insertFn };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      };
    });

    const store = makeStore();
    const entry = makeRecurringEntry();

    const result = await store.dispatch(entradasApi.endpoints.addEntry.initiate(entry));

    expect(result.data).toBeNull();
    // 1 call for main entry + 1 call for bulk recurring entries = 2 total insert calls (down from 12 calls)
    expect(insertCallCount).toBe(2);
    expect(Array.isArray(insertedPayloads[1])).toBe(true);
    expect((insertedPayloads[1] as unknown[]).length).toBe(11);
  });

  it("returns query error if bulk insert fails", async () => {
    let callIndex = 0;
    const insertFn = vi.fn().mockImplementation(() => {
      callIndex++;
      if (callIndex === 2) {
        return Promise.resolve({ error: { message: "Bulk insert database error" } });
      }
      return Promise.resolve({ error: null });
    });

    mockFrom.mockReturnValue({ insert: insertFn });

    const store = makeStore();
    const entry = makeRecurringEntry();

    const result = await store.dispatch(entradasApi.endpoints.addEntry.initiate(entry));

    expect(result.error).toBeDefined();
    expect(result.error).toEqual({
      status: "CUSTOM_ERROR",
      error: "Bulk insert database error",
    });
  });
});
