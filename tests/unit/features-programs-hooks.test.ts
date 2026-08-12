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
  useProgramsQuery,
  useAddProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
} from "@/features/programs";
import type { Program } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

const makeProgram = (): Program => ({
  id: "prog-1",
  name: "Programa Teste",
  type: "milhas",
  maxPassengers: 2,
  passengerCycleType: "mensal",
  passengerCycleDays: 30,
});

const PROGRAM_ROW = {
  id: "prog-1",
  user_id: "user-1",
  name: "Programa Teste",
  type: "milhas",
  max_passengers: 2,
  passenger_cycle_type: "mensal",
  passenger_cycle_days: 30,
};

function makeProgramSelect(rows: unknown[], single: unknown = rows[0]) {
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
  const q = useProgramsQuery();
  const addM = useAddProgramMutation();
  const updateM = useUpdateProgramMutation();
  const delM = useDeleteProgramMutation();
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
  q: { isPending: boolean; data?: Program[]; refetch: unknown };
  addM: { mutateAsync: (program: Program, opts?: { onSuccess?: () => void }) => Promise<unknown> };
  updateM: {
    mutateAsync: (
      input: Partial<Program> & { id: string },
      opts?: { onSuccess?: () => void },
    ) => Promise<unknown>;
  };
  delM: { mutateAsync: (id: string, opts?: { onSuccess?: () => void }) => Promise<unknown> };
};

describe("wrappers de compatibilidade de programs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReset();
    // Padrão: todas as operações bem-sucedidas
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return {
          select: () => makeProgramSelect([PROGRAM_ROW], PROGRAM_ROW),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        };
      }
      // For origem_types, we don't need to mock for the hooks test because the invalidation is handled by the dispatch.
      return {};
    });
  });

  it("useProgramsQuery expõe isPending e data (shape TanStack)", async () => {
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

    await latest().addM.mutateAsync(makeProgram(), { onSuccess });
    await latest().updateM.mutateAsync({ id: "prog-1", name: "Novo Nome" }, { onSuccess });
    await latest().delM.mutateAsync("prog-1", { onSuccess });

    expect(onSuccess).toHaveBeenCalledTimes(3);
  });

  it("delete emite toast.success e logDestructiveOp", async () => {
    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await latest().delM.mutateAsync("prog-1");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Programa excluído com sucesso");
      expect(logDestructiveOp).toHaveBeenCalledWith("delete", "program");
    });
  });

  it("add com erro → toast.error + rethrow no mutateAsync", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { insert: () => Promise.resolve({ error: { message: "db down" } }) };
      }
      return {};
    });

    const { results } = renderHarness();
    const latest = () => results[results.length - 1] as HookResult;
    await expect(latest().addM.mutateAsync(makeProgram())).rejects.toBeTruthy();
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});