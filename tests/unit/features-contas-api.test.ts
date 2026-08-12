import { describe, expect, it, vi, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { readFileSync } from "node:fs";
import { baseApi } from "@/features/api/baseApi";
import { contasApi } from "@/features/contas/contasApi";
import type { Account } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const account: Account = {
  id: "account-1",
  name: "Conta Azul",
  ownerId: "owner-1",
  programId: "program-1",
  type: "milhas",
  balance: 1000,
  averageCostPerMile: 0.1,
  totalInvested: 100,
  status: "ativa",
  createdAt: "2026-08-10",
};

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("contasApi — query", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapeia contas e inclui userId na chave do cache", async () => {
    mockFrom.mockReturnValue({
      select: () =>
        Promise.resolve({
          data: [
            {
              ...account,
              owner_id: account.ownerId,
              program_id: account.programId,
              average_cost_per_mile: account.averageCostPerMile,
              total_invested: account.totalInvested,
              created_at: account.createdAt,
            },
          ],
          error: null,
        }),
    });
    const store = makeStore();
    const first = await store.dispatch(contasApi.endpoints.getAccounts.initiate("user-1"));
    const second = await store.dispatch(contasApi.endpoints.getAccounts.initiate("user-2"));
    expect(first.data?.[0]).toMatchObject(account);
    expect(second.data).toEqual(first.data);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("retorna erro do Supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "db down" } }),
    });
    const result = await makeStore().dispatch(contasApi.endpoints.getAccounts.initiate("user-1"));
    expect(result.error).toBeDefined();
  });
});

describe("contasApi — mutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("insere a conta com o usuário autenticado", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });
    const result = await makeStore().dispatch(contasApi.endpoints.addAccount.initiate(account));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1" }));
  });

  it("converte campos camelCase no update", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({ update });
    const result = await makeStore().dispatch(
      contasApi.endpoints.updateAccount.initiate({
        id: account.id,
        ownerId: "owner-2",
        balance: 2,
      }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith({ owner_id: "owner-2", balance: 2 });
  });

  it("recalcula saldo a partir de entradas confirmadas, vendas ativas e transferências de saída", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "entries") {
        return {
          select: () => ({
            eq: (col: string) =>
              Promise.resolve({
                data:
                  col === "source_account_id"
                    ? [
                        // transferência de saída: 300 pts debitados da conta
                        { amount: 300, description: null },
                      ]
                    : [
                        {
                          miles_generated: 1000,
                          amount: 1000,
                          amount_paid: 100,
                          description: null,
                        },
                        {
                          miles_generated: 500,
                          amount: 500,
                          amount_paid: 50,
                          description: JSON.stringify({ entryStatus: "aguardando" }),
                        },
                      ],
                error: null,
              }),
          }),
        };
      }
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({
              neq: () => Promise.resolve({ data: [{ miles_used: 200 }], error: null }),
            }),
          }),
        };
      }
      return { update };
    });
    const result = await makeStore().dispatch(
      contasApi.endpoints.recalcAccount.initiate(account.id),
    );
    expect(result.data).toBeNull();
    // balance = 1000 (entrada) - 300 (transferência out) - 200 (venda) = 500
    // invested = 100 - 0.1*(300+200) = 50 ; avgCost = 50/500 = 0.1
    expect(update).toHaveBeenCalledWith({
      balance: 500,
      total_invested: 50,
      average_cost_per_mile: 0.1,
    });
  });

  it("invalida contas, entries e sales em delete/recalc", () => {
    const source = ["deleteAccount", "recalcAccount"]
      .map((name) => readFileSync(`src/features/contas/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["accounts", "entries", "sales"\]/g)).toHaveLength(2);
  });
});
