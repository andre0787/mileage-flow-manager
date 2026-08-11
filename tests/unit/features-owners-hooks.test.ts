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
  useOwnersQuery,
  useAddOwnerMutation,
  useUpdateOwnerMutation,
  useDeleteOwnerMutation,
} from "@/features/owners";
import type { Owner } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logDestructiveOp: vi.fn(),
}));

const makeOwner = (): Owner => ({
  id: "owner-1",
  name: "André Luiz",
  cpf: "123.456.789-00",
  phone: "(11) 99999-0000",
});

const OWNER_ROW = {
  id: "owner-1",
  user_id: "user-1",
  name: "André Luiz",
  cpf: "123.456.789-00",
  phone: "(11) 99999-0000",
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

function Harness({ onResult }: { onResult: (r: unknown) => void }) {
  const q = useOwnersQuery();
  const addM = useAddOwnerMutation();
  const updateM = useUpdateOwnerMutation();
  const delM = useDeleteOwnerMutation();
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
  q: { isPending: boolean; data?: Owner[]; refetch: unknown };
  addM: { mutateAsync: (owner: Owner, opts?: { onSuccess?: () => void }) => Promise<unknown> };
  updateM: {
    mutateAsync: (
      input: Partial<Owner> & { id: string },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
  };
  delM: { mutateAsync: (id: string, opts?: { onSuccess?: () => void }) => Promise<unknown> };
};

describe("wrappers de compatibilidade de owners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    mockFrom.mockImplementation((table: string) => {
      if (table !== "owners") return {};
      return {
        select: () => Promise.resolve({ data: [OWNER_ROW], error: null }),
        insert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    });
  });

  it("useOwnersQuery expõe isPending e data (shape TanStack)", async () => {
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

    await latest().addM.mutateAsync(makeOwner(), { onSuccess });
    await latest().updateM.mutateAsync({ id: "owner-1", phone: "(11) 88888-1111" }, { onSuccess });
    await latest().delM.mutateAsync("owner-1", { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(3);
  });

  it("delete emite toast.success e logDestructiveOp", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().delM.mutateAsync("owner-1");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Dono excluído com sucesso");
      expect(logDestructiveOp).toHaveBeenCalledWith("delete", "owner");
    });
  });

  it("add com erro → toast.error + rethrow no mutateAsync", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table !== "owners") return {};
      return { insert: () => Promise.resolve({ error: { message: "db down" } }) };
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(latest().addM.mutateAsync(makeOwner())).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao criar dono"));
  });
});