import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "@/features/entradas/entradasApi";
import type { PointEntry } from "@/types";

// ─── Mock de @/lib/supabase ──────────────────────────────────────────
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Cadeia supabase completa: qualquer chamada encadeada resolve data/error.
function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const call = (name: string, ...args: unknown[]) => {
    if (!(name in c)) c[name] = vi.fn();
    (c[name] as ReturnType<typeof vi.fn>)(...args);
    return c;
  };
  c.select = call("select");
  c.eq = call("eq");
  c.single = call("single");
  c.maybeSingle = call("maybeSingle");
  c.insert = call("insert");
  c.update = call("update");
  c.delete = call("delete");
  c.filter = call("filter");
  c.resolve = () => Promise.resolve(result);
  return c;
}

const makeEntry = (): PointEntry => ({
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
  date: "2026-08-10",
  entryStatus: "aguardando",
  recurrenceInterval: null,
  recurrenceEnd: null,
  recurrenceDayOfMonth: null,
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

describe("entradasApi — getEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mapeia as linhas de entries via mapEntry", async () => {
    const rows = [
      {
        id: "e1",
        account_id: "acc-1",
        origem_type_id: "origem-1",
        amount: 1000,
        amount_paid: 50,
        cost_per_thousand: 20,
        conversion_rate: 1,
        miles_generated: 1000,
        cost_per_mile: 0.05,
        source_account_id: null,
        bonus_percent: null,
        description: null,
        date: "2026-08-10",
      },
    ];
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: rows, error: null }),
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.getEntries.initiate(undefined));
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe("e1");
    expect(result.data![0].accountId).toBe("acc-1");
    expect(mockFrom).toHaveBeenCalledWith("entries");
  });

  it("propaga erro do supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.getEntries.initiate(undefined));
    expect(result.error).toBeDefined();
  });
});

describe("entradasApi — addEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("insere a entrada e não atualiza contas quando aguardando", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert,
    });

    const store = makeStore();
    const entry = makeEntry(); // entryStatus = aguardando
    const result = await store.dispatch(entradasApi.endpoints.addEntry.initiate(entry));

    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledTimes(1);
    // aguardando → sem chamadas a accounts
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("atualiza conta destino quando confirmada", async () => {
    const entry = { ...makeEntry(), entryStatus: "confirmada" as const };
    const insert = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({
      insert,
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }) }),
      }),
      update,
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.addEntry.initiate(entry));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});

describe("entradasApi — deleteEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleta a entrada e reverte o saldo quando confirmada", async () => {
    const entry = { ...makeEntry(), entryStatus: "confirmada" as const };
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({
      delete: del,
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }) }),
      }),
      update,
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.deleteEntry.initiate(entry));
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });
});
