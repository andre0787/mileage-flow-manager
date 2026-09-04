import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { vendasApi } from "@/features/vendas/vendasApi";
import { selectAllSales } from "@/features/vendas/adapter";
import type { Sale } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const makeSale = (): Sale => ({
  id: "sale-1",
  accountId: "acc-1",
  accountName: "Conta Milhas",
  ownerName: "Dono",
  program: "Programa X",
  clientId: "client-1",
  clientName: "Cliente Azul",
  milesUsed: 10000,
  saleValue: 2000,
  pricePerMile: 0.2,
  costPerMile: 0.05,
  additionalCost: 100,
  additionalCostDesc: "Taxa",
  profit: 1450,
  profitMargin: 0.725,
  status: "pendente",
  ticketLocator: "AB12CD",
  passengers: [],
  date: "2026-08-10",
});

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("vendasApi — getVendas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapeia as linhas de sales via mapSale", async () => {
    const rows = [
      {
        id: "sale-1",
        account_id: "acc-1",
        account_name: "Conta Milhas",
        owner_name: "Dono",
        program: "Programa X",
        client_id: "client-1",
        client_name: "Cliente Azul",
        miles_used: 10000,
        sale_value: 2000,
        price_per_mile: 0.2,
        cost_per_mile: 0.05,
        additional_cost: 100,
        additional_cost_desc: "Taxa",
        profit: 1450,
        profit_margin: 0.725,
        status: "pendente",
        ticket_locator: "AB12CD",
        passengers: [],
        date: "2026-08-10",
      },
    ];
    mockFrom.mockReturnValue({ select: () => Promise.resolve({ data: rows, error: null }) });

    const result = await makeStore().dispatch(vendasApi.endpoints.getVendas.initiate("user-1"));
    expect(selectAllSales(result.data!)).toHaveLength(1);
    expect(selectAllSales(result.data!)[0]).toMatchObject({
      accountId: "acc-1",
      clientName: "Cliente Azul",
      milesUsed: 10000,
      status: "pendente",
    });
    expect(mockFrom).toHaveBeenCalledWith("sales");
  });

  it("propaga erro do supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });
    const result = await makeStore().dispatch(vendasApi.endpoints.getVendas.initiate("user-1"));
    expect(result.error).toBeDefined();
  });
});

describe("vendasApi — addVenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("insere a venda com user_id e atualiza a conta", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({
      insert,
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { balance: 5000, total_invested: 0, average_cost_per_mile: 0 },
              error: null,
            }),
        }),
      }),
      update,
    });

    const result = await makeStore().dispatch(vendasApi.endpoints.addVenda.initiate(makeSale()));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1" }));
    expect(update).toHaveBeenCalled();
  });

  it("propaga erro de inserção", async () => {
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: { message: "db down" } }) });
    const result = await makeStore().dispatch(vendasApi.endpoints.addVenda.initiate(makeSale()));
    expect(result.error).toBeDefined();
  });
});

describe("vendasApi — updateVenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza a venda convertendo camelCase para snake_case", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: {
                miles_used: 10000,
                status: "pendente",
                account_id: null,
                cost_per_mile: 0.05,
              },
              error: null,
            }),
        }),
      }),
      update,
    });

    const result = await makeStore().dispatch(
      vendasApi.endpoints.updateVenda.initiate({ id: "sale-1", saleValue: 2500 }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ sale_value: 2500 }));
  });

  it("propaga erro quando a venda não existe", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    });
    const result = await makeStore().dispatch(
      vendasApi.endpoints.updateVenda.initiate({ id: "missing", saleValue: 1 }),
    );
    expect(result.error).toBeDefined();
  });
});

describe("vendasApi — deleteVenda / cancelVenda", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deleta a venda e restaura a conta", async () => {
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    let salesCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        salesCalls += 1;
        if (salesCalls === 1) {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { account_id: "acc-1", miles_used: 10000, cost_per_mile: 0.05 },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return { delete: del };
      }
      // Sem crédito vinculado: ledger vazio → hard-delete liberado.
      if (table === "client_credit_movements") {
        return {
          select: () => ({
            eq: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { balance: 5000, total_invested: 0, average_cost_per_mile: 0 },
                error: null,
              }),
          }),
        }),
        update,
      };
    });

    const result = await makeStore().dispatch(vendasApi.endpoints.deleteVenda.initiate("sale-1"));
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it("bloqueia a exclusão quando há crédito vinculado (exige cancelamento)", async () => {
    const del = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { account_id: "acc-1", miles_used: 10000, cost_per_mile: 0.05 },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "client_credit_movements") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: "mov-1" }], error: null }),
            }),
          }),
        };
      }
      return { delete: del };
    });

    const result = await makeStore().dispatch(vendasApi.endpoints.deleteVenda.initiate("sale-1"));
    expect(result.error).toBeDefined();
    expect(del).not.toHaveBeenCalled();
  });

  it("cancela a venda (status cancelado) e restaura a conta", async () => {
    const updSale = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    const updAcc = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    let salesCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        salesCalls += 1;
        if (salesCalls === 1) {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: "sale-1",
                      account_id: "acc-1",
                      miles_used: 10000,
                      cost_per_mile: 0.05,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return { update: updSale };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { balance: 5000, total_invested: 0 }, error: null }),
          }),
        }),
        update: updAcc,
      };
    });

    const result = await makeStore().dispatch(vendasApi.endpoints.cancelVenda.initiate("sale-1"));
    expect(result.data).toBeNull();
    expect(updSale).toHaveBeenCalledWith({ status: "cancelado" });
    expect(updAcc).toHaveBeenCalled();
  });

  it("declara invalidação de sales e accounts nos endpoints base", async () => {
    const { readFileSync } = await import("node:fs");
    const source = ["addVenda", "updateVenda", "deleteVenda"]
      .map((name) => readFileSync(`src/features/vendas/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["sales", "accounts"\]/g)).toHaveLength(2);
  });

  it("declara invalidação incluindo clients nos endpoints com crédito", async () => {
    const { readFileSync } = await import("node:fs");
    const source = ["addVenda", "cancelVenda", "receiveVenda"]
      .map((name) => readFileSync(`src/features/vendas/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["sales", "accounts", "clients"\]/g)).toHaveLength(3);
  });
});
