import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement, type ReactElement } from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { baseApi } from "@/features/api/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import {
  useAccountsQuery,
  useAddAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useRecalcAccountMutation,
} from "@/features/contas";
import type { Account } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

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
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    preloadedState: {
      auth: { user: { id: "user-1" } as never, session: null, loading: false },
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

function Harness({ onResult }: { onResult: (result: unknown) => void }) {
  onResult({
    query: useAccountsQuery(),
    add: useAddAccountMutation(),
    update: useUpdateAccountMutation(),
    delete: useDeleteAccountMutation(),
    recalc: useRecalcAccountMutation(),
  });
  return null;
}

function renderHarness() {
  const results: unknown[] = [];
  const store = makeStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const tree = createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(
      Provider,
      { store },
      createElement(Harness, { onResult: (result) => results.push(result) }),
    ),
  ) as ReactElement;
  render(tree);
  return { results, queryClient };
}

describe("wrappers de compatibilidade de contas", () => {
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

  it("expõe o shape público de query e mutations", () => {
    const result = renderHarness().results[0] as Record<string, Record<string, unknown>>;
    expect(result.query).toHaveProperty("isPending");
    expect(result.query).toHaveProperty("refetch");
    expect(typeof result.add.mutate).toBe("function");
    expect(typeof result.add.mutateAsync).toBe("function");
    expect(result.delete).toHaveProperty("isPending");
    expect(result.recalc).toHaveProperty("isPending");
  });

  it("mutateAsync dos quatro wrappers executa onSuccess", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "entries") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === "sales") {
        return {
          select: () => ({
            eq: () => ({
              neq: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    });
    const { results } = renderHarness();
    const latest = () =>
      results[results.length - 1] as {
        add: { mutateAsync: (a: Account, options: { onSuccess: () => void }) => Promise<unknown> };
        update: {
          mutateAsync: (
            input: Partial<Account> & { id: string },
            options: { onSuccess: () => void },
          ) => Promise<unknown>;
        };
        delete: {
          mutateAsync: (id: string, options: { onSuccess: () => void }) => Promise<unknown>;
        };
        recalc: {
          mutateAsync: (id: string, options: { onSuccess: () => void }) => Promise<unknown>;
        };
      };
    const onSuccess = vi.fn();

    await latest().add.mutateAsync(account, { onSuccess });
    await latest().update.mutateAsync({ id: account.id, name: "Conta Nova" }, { onSuccess });
    await latest().delete.mutateAsync(account.id, { onSuccess });
    await latest().recalc.mutateAsync(account.id, { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(4);
  });

  it("delete invalida também o cache TanStack de sales", async () => {
    const { results, queryClient } = renderHarness();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const latest = () =>
      results[results.length - 1] as {
        delete: { mutateAsync: (id: string) => Promise<unknown> };
      };

    await latest().delete.mutateAsync(account.id);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["sales"],
      refetchType: "all",
    });
  });

  it("delete com erro notifica e relança no mutateAsync", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: [], error: null }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: "db down" } }) }),
    });
    const { results } = renderHarness();
    const onError = vi.fn();
    const del = (
      results[0] as {
        delete: {
          mutateAsync: (id: string, options: { onError: () => void }) => Promise<unknown>;
        };
      }
    ).delete;
    await expect(del.mutateAsync(account.id, { onError })).rejects.toBeTruthy();
    expect(onError).toHaveBeenCalledOnce();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
