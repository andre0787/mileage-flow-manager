import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logError, logDestructiveOp } from "@/lib/logger";
import { clearAccountDataFn, useClearAccountDataMutation } from "@/hooks/useDatabase/shared";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: { id: "user-123" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn(), logDestructiveOp: vi.fn() }));

async function clearAccountDataSequential() {
  const tables = ["sales", "entries", "accounts", "clients", "owners", "programs", "origem_types"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw error;
  }
}

function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe("clearAccountDataFn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compares performance against sequential execution", async () => {
    const DELAY_MS = 50;
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          delete: () => ({
            not: async () => {
              await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
              return { error: null };
            },
          }),
        }) as ReturnType<typeof supabase.from>,
    );

    const startSeq = performance.now();
    await clearAccountDataSequential();
    const durationSeq = performance.now() - startSeq;

    const startPar = performance.now();
    await clearAccountDataFn();
    const durationPar = performance.now() - startPar;

    expect(durationPar).toBeLessThan(durationSeq * 0.6);
  });

  it("deletes child tables first, then parent tables", async () => {
    const executionOrder: string[] = [];

    vi.mocked(supabase.from).mockImplementation(
      (table: string) =>
        ({
          delete: () => ({
            not: async () => {
              executionOrder.push(table);
              return { error: null };
            },
          }),
        }) as ReturnType<typeof supabase.from>,
    );

    await clearAccountDataFn();

    expect(executionOrder.slice(0, 2)).toEqual(expect.arrayContaining(["sales", "entries"]));
    expect(executionOrder.slice(2)).toEqual(
      expect.arrayContaining(["accounts", "clients", "owners", "programs", "origem_types"]),
    );
  });

  it("throws error if a deletion fails", async () => {
    vi.mocked(supabase.from).mockImplementation(
      (table: string) =>
        ({
          delete: () => ({
            not: async () => {
              if (table === "entries") return { error: new Error("Deletion failed") };
              return { error: null };
            },
          }),
        }) as ReturnType<typeof supabase.from>,
    );

    await expect(clearAccountDataFn()).rejects.toThrow("Deletion failed");
  });
});

describe("useClearAccountDataMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles successful deletion", async () => {
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          delete: () => ({ not: async () => ({ error: null }) }),
          insert: async () => ({ error: null }),
        }) as unknown as ReturnType<typeof supabase.from>,
    );

    const { queryClient, wrapper } = createQueryClientWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useClearAccountDataMutation(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ refetchType: "all" });
    expect(logDestructiveOp).toHaveBeenCalledWith("clear", "account_data");
    expect(toast.success).toHaveBeenCalledWith("Dados da conta limpos com sucesso");
  });

  it("handles error when deletion fails", async () => {
    const error = new Error("Database error on clear");
    vi.mocked(supabase.from).mockImplementation(
      (table: string) =>
        ({
          delete: () => ({
            not: async () => (table === "entries" ? { error } : { error: null }),
          }),
        }) as ReturnType<typeof supabase.from>,
    );

    const { wrapper } = createQueryClientWrapper();

    const { result } = renderHook(() => useClearAccountDataMutation(), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(logError).toHaveBeenCalledWith("clearAccountData", error);
    expect(toast.error).toHaveBeenCalledWith("Erro ao limpar dados da conta");
  });
});
