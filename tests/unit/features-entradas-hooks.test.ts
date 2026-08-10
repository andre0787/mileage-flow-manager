import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement, type ReactElement } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { baseApi } from "@/features/api/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import {
  useEntriesQuery,
  useAddEntryMutation,
  useDeleteEntryMutation,
} from "@/features/entradas";
import type { PointEntry } from "@/types";

// ─── Mocks ───────────────────────────────────────────────────────────
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => {
      if (table === "entries" && mockSelect.mock.calls.length === 0) {
        return { select: mockSelect, delete: mockDelete };
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        delete: mockDelete,
      };
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logDestructiveOp: vi.fn(),
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
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

function EntriesHarness({ onResult }: { onResult: (r: unknown) => void }) {
  const q = useEntriesQuery();
  const addM = useAddEntryMutation();
  const delM = useDeleteEntryMutation();
  onResult({ q, addM, delM });
  return null;
}

function renderHarness(store = makeStore()) {
  const results: Record<string, unknown>[] = [];
  const tree = createElement(
    Provider,
    { store },
    createElement(EntriesHarness, { onResult: (r) => results.push(r) }),
  ) as ReactElement;
  render(tree);
  return results;
}

describe("wrappers de compat entradas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSelect.mockResolvedValue({ data: [], error: null });
  });

  it("useEntriesQuery expõe isPending e data (shape TanStack)", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const results = renderHarness();
    const first = results[0] as { q: { isPending: boolean; data?: unknown } };
    expect(first.q).toHaveProperty("isPending");
    expect(first.q).toHaveProperty("data");
    expect(first.q).toHaveProperty("refetch");

    await waitFor(() => {
      const last = results[results.length - 1] as { q: { isPending: boolean } };
      expect(last.q.isPending).toBe(false);
    });
  });

  it("useAddEntryMutation retorna mutate/mutateAsync (shape TanStack)", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const results = renderHarness();
    const { addM } = results[0] as {
      addM: { mutate: unknown; mutateAsync: unknown; isPending: boolean };
    };
    expect(typeof addM.mutate).toBe("function");
    expect(typeof addM.mutateAsync).toBe("function");
    expect(addM).toHaveProperty("isPending");
  });

  it("deleteEntry com erro → toast.error + rethrow no mutateAsync", async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    // from('entries').delete().eq() falha
    mockDelete.mockReturnValue({ eq: () => Promise.resolve({ error: { message: "db down" } }) });
    const results = renderHarness();
    const { delM } = results[0] as {
      delM: { mutateAsync: (e: PointEntry) => Promise<unknown> };
    };

    await expect(delM.mutateAsync(makeEntry())).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
