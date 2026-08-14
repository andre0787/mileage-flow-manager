import { describe, it, expect, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "@/features/entradas/entradasApi";
import { selectAllEntries } from "@/features/entradas/adapter";
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
    const result = await store.dispatch(entradasApi.endpoints.getEntries.initiate("user-1"));
    expect(selectAllEntries(result.data!)).toHaveLength(1);
    expect(selectAllEntries(result.data!)[0].id).toBe("e1");
    expect(selectAllEntries(result.data!)[0].accountId).toBe("acc-1");
    expect(mockFrom).toHaveBeenCalledWith("entries");
  });

  it("usa userId na chave do cache para isolar sessões", async () => {
    mockFrom.mockReturnValue({ select: () => Promise.resolve({ data: [], error: null }) });
    const store = makeStore();
    await store.dispatch(entradasApi.endpoints.getEntries.initiate("user-1"));
    await store.dispatch(entradasApi.endpoints.getEntries.initiate("user-2"));
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("propaga erro do supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.getEntries.initiate("user-1"));
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
        eq: () => ({
          single: () =>
            Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }),
        }),
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

  it("deleta a entrada, filhos recorrentes e reverte o saldo quando confirmada", async () => {
    const entry = {
      ...makeEntry(),
      entryStatus: "confirmada" as const,
      recurrenceInterval: "monthly",
      recurrenceEnd: "2026-12-31",
    };
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const childDelete = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const select = vi.fn().mockReturnValue({
      filter: () => Promise.resolve({ data: [{ id: "child-1" }], error: null }),
    });
    let entriesCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "entries") {
        entriesCalls += 1;
        if (entriesCalls === 1) return { select };
        if (entriesCalls === 2) return { delete: childDelete };
        return { delete: del };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }),
          }),
        }),
        update,
      };
    });

    const store = makeStore();
    const result = await store.dispatch(entradasApi.endpoints.deleteEntry.initiate(entry));
    expect(result.data).toBeNull();
    expect(childDelete).toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it("declara invalidação de entries e accounts em todas as mutations", async () => {
    const { readFileSync } = await import("node:fs");
    const source = ["addEntry", "confirmEntry", "updateEntry", "deleteEntry"]
      .map((name) => readFileSync(`src/features/entradas/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["entries", "accounts"\]/g)).toHaveLength(4);
  });
});

describe("entradasApi — updateEntry (regressão: troca de conta destino)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reverte a conta antiga e credita a nova quando o accountId muda", async () => {
    const confirmed = (): PointEntry => ({
      ...makeEntry(),
      entryStatus: "confirmada",
      accountId: "acc-1",
      amount: 1000,
      amountPaid: 50,
      milesGenerated: 1000,
    });
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    // saldos por conta: acc-1 (antiga) = 5000, acc-2 (nova) = 2000
    const accountState: Record<string, { balance: number; total_invested: number }> = {
      "acc-1": { balance: 5000, total_invested: 250 },
      "acc-2": { balance: 2000, total_invested: 100 },
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === "entries") {
        return { delete: del, insert };
      }
      return {
        select: () => ({
          // eq(column, id) — captura o SEGUNDO argumento (o id da conta)
          eq: (_col: string, id: string) => ({
            single: () => Promise.resolve({ data: accountState[id] ?? null, error: null }),
          }),
        }),
        update,
      };
    });

    const store = makeStore();
    const result = await store.dispatch(
      entradasApi.endpoints.updateEntry.initiate({
        oldEntry: confirmed(),
        updates: { accountId: "acc-2" },
      }),
    );
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();

    // conta antiga revertida (delta = -1000 / -50)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 4000, total_invested: 200 }),
    );
    // conta nova creditada com o valor completo (não um delta)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 3000, total_invested: 150 }),
    );
  });
});
