import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { baseApi } from "@/features/api/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import {
  useClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/features/clientes";
import type { Client } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

const client: Client = {
  id: "client-1",
  name: "Cliente Azul",
  phone: "11999999999",
  totalPurchases: 0,
  usageHistory: [],
};

function renderHarness() {
  const results: unknown[] = [];
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    preloadedState: {
      auth: { user: { id: "user-1" } as never, session: null, loading: false },
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Harness() {
    results.push({
      query: useClientsQuery(),
      add: useAddClientMutation(),
      update: useUpdateClientMutation(),
      delete: useDeleteClientMutation(),
    });
    return null;
  }
  const tree = createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(Provider, { store }, createElement(Harness)),
  ) as ReactElement;
  render(tree);
  return { results, queryClient };
}

type HookResult = {
  add: { mutateAsync: (client: Client, options?: { onSuccess?: () => void }) => Promise<unknown> };
  update: {
    mutateAsync: (
      input: Partial<Client> & { id: string },
      options?: { onSuccess?: () => void },
    ) => Promise<unknown>;
  };
  delete: {
    mutateAsync: (id: string, options?: { onSuccess?: () => void }) => Promise<unknown>;
  };
};

describe("wrappers de compatibilidade de clientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    });
  });

  it("preserva query e mutations públicas", () => {
    const result = renderHarness().results[0] as Record<string, Record<string, unknown>>;
    expect(result.query).toHaveProperty("isPending");
    expect(result.query).toHaveProperty("refetch");
    expect(typeof result.add.mutate).toBe("function");
    expect(typeof result.add.mutateAsync).toBe("function");
    expect(typeof result.update.mutateAsync).toBe("function");
    expect(result.delete).toHaveProperty("isPending");
  });

  it("executa onSuccess nos quatro mutateAsync", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    const onSuccess = vi.fn();
    await latest().add.mutateAsync(client, { onSuccess });
    await latest().update.mutateAsync({ id: client.id, name: "Cliente Novo" }, { onSuccess });
    await latest().delete.mutateAsync(client.id, { onSuccess });
    expect(onSuccess).toHaveBeenCalledTimes(3);
  });

  it("aguarda o refetch de clientes antes do sucesso de add e update", async () => {
    const events: string[] = [];
    mockFrom.mockImplementation(() => ({
      select: () => {
        events.push("select");
        return Promise.resolve({ data: [], error: null });
      },
      insert: () => {
        events.push("insert");
        return Promise.resolve({ error: null });
      },
      update: () => ({
        eq: () => {
          events.push("update");
          return Promise.resolve({ error: null });
        },
      }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }));
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;

    await latest().add.mutateAsync(client, { onSuccess: () => events.push("add-success") });
    await latest().update.mutateAsync(
      { id: client.id, name: "Cliente Novo" },
      { onSuccess: () => events.push("update-success") },
    );

    const addIndex = events.indexOf("insert");
    const addSuccessIndex = events.indexOf("add-success");
    const updateIndex = events.indexOf("update");
    const updateSuccessIndex = events.indexOf("update-success");
    const addRefetchIndex = events.findIndex(
      (event, index) => index > addIndex && event === "select",
    );
    const updateRefetchIndex = events.findIndex(
      (event, index) => index > updateIndex && event === "select",
    );
    expect(addRefetchIndex).toBeGreaterThan(addIndex);
    expect(addRefetchIndex).toBeLessThan(addSuccessIndex);
    expect(updateRefetchIndex).toBeGreaterThan(updateIndex);
    expect(updateRefetchIndex).toBeLessThan(updateSuccessIndex);
  });

  it("delete invalida cache TanStack de sales", async () => {
    const { results, queryClient } = renderHarness();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    await (results[0] as HookResult).delete.mutateAsync(client.id);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["sales"], refetchType: "all" });
  });
});
