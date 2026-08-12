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
  useOrigemTypesQuery,
  useAddOrigemTypeMutation,
  useUpdateOrigemTypeMutation,
  useDeleteOrigemTypeMutation,
} from "@/features/origemTypes";
import type { OrigemType } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

const makeOrigemType = (): OrigemType => ({
  id: "ot-1",
  name: "Compra de pontos",
  accountType: "pontos",
  color: "#3b82f6",
});

const ORIGEM_TYPE_ROW = {
  id: "ot-1",
  user_id: "user-1",
  name: "Compra de pontos",
  account_type: "pontos",
  color: "#3b82f6",
};

function makeOrigemTypeSelect(rows: unknown[], single: unknown = rows[0]) {
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
  const q = useOrigemTypesQuery();
  const addM = useAddOrigemTypeMutation();
  const updateM = useUpdateOrigemTypeMutation();
  const delM = useDeleteOrigemTypeMutation();
  onResult({ q, addM, updateM, delM });
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
  q: { isPending: boolean; data?: OrigemType[]; refetch: unknown };
  addM: {
    mutateAsync: (ot: OrigemType, opts?: { onSuccess?: () => void }) => Promise<unknown>;
  };
  updateM: {
    mutateAsync: (
      input: Partial<OrigemType> & { id: string },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
  };
  delM: { mutateAsync: (id: string, opts?: { onSuccess?: () => void }) => Promise<unknown> };
};

describe("wrappers de compatibilidade de origemTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockFrom.mockImplementation((table: string) => {
      if (table === "origem_types") {
        return {
          select: () => makeOrigemTypeSelect([ORIGEM_TYPE_ROW], ORIGEM_TYPE_ROW),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      return {};
    });
  });

  it("useOrigemTypesQuery expõe isPending e data (shape TanStack)", async () => {
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
    expect(r.addM).toHaveProperty("isPending");
  });

  it("executa onSuccess nos mutateAsync de add/update/delete", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    const onSuccess = vi.fn();

    await latest().addM.mutateAsync(makeOrigemType(), { onSuccess });
    await latest().updateM.mutateAsync({ id: "ot-1", name: "Novo Nome" }, { onSuccess });
    await latest().delM.mutateAsync("ot-1", { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(3);
  });

  it("delete emite toast.success e logDestructiveOp", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().delM.mutateAsync("ot-1");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Tipo de operação excluído com sucesso");
      expect(logDestructiveOp).toHaveBeenCalledWith("delete", "origem_type");
    });
  });

  it("add com erro → toast.error + rethrow no mutateAsync", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "origem_types") {
        return { insert: () => Promise.resolve({ error: { message: "db down" } }) };
      }
      return {};
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(latest().addM.mutateAsync(makeOrigemType())).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
