import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { authReducer } from "@/features/auth/authSlice";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  useAccountAlerts,
  useAddAccountAlertMutation,
  useToggleAccountAlertMutation,
} from "@/features/alerts";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

const ALERT_ROW = {
  id: "al-1",
  account_id: "acc-1",
  user_id: "user-1",
  date: "2026-08-10",
  observation: "Renovar clube",
  read: false,
  created_at: "2026-08-07T10:00:00.000Z",
};

// select de "account_alerts" atende a query: await from(...).select("*").order("date", {ascending:false})
function makeAlertsSelect(rows: unknown[]) {
  return {
    select: () => ({
      order: () => Promise.resolve({ data: rows, error: null }),
    }),
  };
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
  const q = useAccountAlerts();
  const addM = useAddAccountAlertMutation();
  const toggleM = useToggleAccountAlertMutation();
  onResult({ q, addM, toggleM });
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
  q: { isPending: boolean; data?: unknown[]; refetch: unknown };
  addM: {
    mutate: (
      alert: { accountId: string; date: string; observation: string },
      opts?: { onSuccess?: () => void },
    ) => void;
    mutateAsync: (
      alert: { accountId: string; date: string; observation: string },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
    isPending: boolean;
  };
  toggleM: {
    mutate: (input: { id: string; read: boolean }, opts?: { onSuccess?: () => void }) => void;
    mutateAsync: (
      input: { id: string; read: boolean },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
    isPending: boolean;
  };
};

describe("wrappers de compatibilidade de alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockFrom.mockImplementation((table: string) => {
      if (table === "account_alerts") {
        return {
          select: makeAlertsSelect([ALERT_ROW]),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return {};
    });
  });

  it("useAccountAlerts expõe isPending, data e refetch (shape TanStack)", async () => {
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

  it("mutações expõem mutate/mutateAsync e isPending (shape TanStack)", () => {
    const { results } = renderHarness();
    const r = results[0] as HookResult;
    expect(typeof r.addM.mutate).toBe("function");
    expect(typeof r.addM.mutateAsync).toBe("function");
    expect(typeof r.toggleM.mutate).toBe("function");
    expect(typeof r.toggleM.mutateAsync).toBe("function");
    expect(r.addM).toHaveProperty("isPending");
    expect(r.toggleM).toHaveProperty("isPending");
  });

  it("executa onSuccess no mutate de add", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    const onSuccess = vi.fn();

    latest().addM.mutate(
      { accountId: "acc-1", date: "2026-08-10", observation: "Renovar" },
      { onSuccess },
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("executa onSuccess no mutateAsync de toggle", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    const onSuccess = vi.fn();

    await latest().toggleM.mutateAsync({ id: "al-1", read: true }, { onSuccess });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("add emite toast.success 'Alerta adicionado'", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().addM.mutateAsync({
      accountId: "acc-1",
      date: "2026-08-10",
      observation: "Renovar",
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Alerta adicionado");
    });
  });

  it("add com erro → toast.error + rethrow no mutateAsync", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "account_alerts") {
        return { insert: () => Promise.resolve({ error: { message: "db down" } }) };
      }
      return {};
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(
      latest().addM.mutateAsync({ accountId: "acc-1", date: "2026-08-10", observation: "Renovar" }),
    ).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao adicionar alerta"));
  });

  it("toggle com erro → toast.error 'Erro ao atualizar alerta' + logError", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "account_alerts") {
        return { update: () => ({ eq: () => Promise.resolve({ error: { message: "boom" } }) }) };
      }
      return {};
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(latest().toggleM.mutateAsync({ id: "al-1", read: true })).rejects.toBeTruthy();
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao atualizar alerta");
      expect(logError).toHaveBeenCalledWith("toggleAccountAlert", expect.anything());
    });
  });
});
