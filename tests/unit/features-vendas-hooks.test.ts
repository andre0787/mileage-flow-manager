import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { logDestructiveOp } from "@/lib/logger";
import {
  useSalesQuery,
  useAddSaleMutation,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
  useCancelSaleMutation,
} from "@/features/vendas";
import type { Sale } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

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

const SALE_ROW = {
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
};

const ACC_ROW = {
  balance: 5000,
  total_invested: 0,
  average_cost_per_mile: 0,
};

// select de "sales" atende os dois usos:
//  - query getVendas: await from("sales").select("*")                 → { data: rows, error }
//  - fetch de mutation: await from("sales").select("*").eq(...).single() → { data: row, error }
// Um objeto thenable com .eq resolve os dois: `await` usa .then, mutations usam .eq.
function makeSalesSelect(rows: unknown[], single: unknown = rows[0]) {
  const select = {
    then: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(onFulfilled),
    eq: () => ({ single: () => Promise.resolve({ data: single, error: null }) }),
  };
  return select;
}

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    preloadedState: {
      auth: { user: { id: "user-1" } as never, session: null, loading: false },
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

function Harness({ onResult }: { onResult: (r: unknown) => void }) {
  const q = useSalesQuery();
  const addM = useAddSaleMutation();
  const updateM = useUpdateSaleMutation();
  const delM = useDeleteSaleMutation();
  const cancelM = useCancelSaleMutation();
  onResult({ q, addM, updateM, delM, cancelM });
  return null;
}

function renderHarness(store = makeStore()) {
  const results: unknown[] = [];
  const tree = createElement(
    Provider,
    { store },
    createElement(Harness, { onResult: (r) => results.push(r) }),
  ) as ReactElement;
  render(tree);
  return { results, store };
}

type HookResult = {
  q: { isPending: boolean; data?: Sale[]; refetch: unknown };
  addM: { mutateAsync: (sale: Sale, opts?: { onSuccess?: () => void }) => Promise<unknown> };
  updateM: {
    mutateAsync: (
      input: Partial<Sale> & { id: string },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
  };
  delM: { mutateAsync: (id: string, opts?: { onSuccess?: () => void }) => Promise<unknown> };
  cancelM: { mutateAsync: (id: string, opts?: { onSuccess?: () => void }) => Promise<unknown> };
};

describe("wrappers de compatibilidade de vendas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    // Padrão: todas as operações bem-sucedidas, conta e venda existentes
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: () => makeSalesSelect([SALE_ROW], SALE_ROW),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: ACC_ROW, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    });
  });

  it("useSalesQuery expõe isPending e data (shape TanStack)", async () => {
    const { results } = renderHarness();
    const first = results[0] as HookResult;
    expect(first.q).toHaveProperty("isPending");
    expect(first.q).toHaveProperty("data");
    expect(first.q).toHaveProperty("refetch");
    await waitFor(() => {
      const last = results[results.length - 1] as HookResult;
      expect(last.q.isPending).toBe(false);
    });
  });

  it("mutações expõem mutate/mutateAsync (shape TanStack)", () => {
    const { results } = renderHarness();
    const r = results[0] as HookResult;
    expect(typeof r.addM.mutate).toBe("function");
    expect(typeof r.addM.mutateAsync).toBe("function");
    expect(typeof r.updateM.mutateAsync).toBe("function");
    expect(typeof r.delM.mutateAsync).toBe("function");
    expect(typeof r.cancelM.mutateAsync).toBe("function");
    expect(r.addM).toHaveProperty("isPending");
  });

  it("executa onSuccess nos mutateAsync de add/update/delete/cancel", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    const onSuccess = vi.fn();

    await latest().addM.mutateAsync(makeSale(), { onSuccess });
    await latest().updateM.mutateAsync({ id: "sale-1", saleValue: 2500 }, { onSuccess });
    await latest().delM.mutateAsync("sale-1", { onSuccess });
    await latest().cancelM.mutateAsync("sale-1", { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(4);
  });

  it("aguarda o refetch de vendas antes do sucesso de add", async () => {
    const events: string[] = [];
    const addSelect = () =>
      ({
        then: (onFulfilled: (v: unknown) => unknown) => {
          events.push("select");
          return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        },
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }) as unknown;
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: addSelect,
          insert: () => {
            events.push("insert");
            return Promise.resolve({ error: null });
          },
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: ACC_ROW, error: null }),
          }),
        }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().addM.mutateAsync(makeSale(), { onSuccess: () => events.push("add-success") });

    const insertIndex = events.indexOf("insert");
    const successIndex = events.indexOf("add-success");
    expect(insertIndex).toBeGreaterThanOrEqual(0);
    expect(successIndex).toBeGreaterThan(insertIndex);
  });

  it("delete emite toast.success e logDestructiveOp", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().delM.mutateAsync("sale-1");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Venda excluída com sucesso");
      expect(logDestructiveOp).toHaveBeenCalledWith("delete", "sale");
    });
  });

  it("add com erro → toast.error + rethrow no mutateAsync", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "sales") {
        return { insert: () => Promise.resolve({ error: { message: "db down" } }) };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: ACC_ROW, error: null }),
          }),
        }),
      };
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(latest().addM.mutateAsync(makeSale())).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
