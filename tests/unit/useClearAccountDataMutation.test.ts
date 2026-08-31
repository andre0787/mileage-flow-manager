import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/lib/supabase";
import { clearAccountDataFn } from "@/hooks/useDatabase/shared";

vi.mock("@/lib/supabase", () => {
  const deleteMock = vi.fn();
  const notMock = vi.fn();
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
    },
    __mocks: {
      deleteMock,
      notMock,
      fromMock,
    },
  };
});

async function clearAccountDataSequential() {
  const tables = [
    "sales",
    "entries",
    "accounts",
    "clients",
    "owners",
    "programs",
    "origem_types",
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw error;
  }
}

describe("clearAccountDataFn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compares performance against sequential execution", async () => {
    const DELAY_MS = 50;
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        delete: () => ({
          not: async () => {
            await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
            return { error: null };
          },
        }),
      } as ReturnType<typeof supabase.from>;
    });

    const startSeq = performance.now();
    await clearAccountDataSequential();
    const durationSeq = performance.now() - startSeq;

    const startPar = performance.now();
    await clearAccountDataFn();
    const durationPar = performance.now() - startPar;

    console.log(`Sequential duration (7 x ${DELAY_MS}ms): ${durationSeq.toFixed(2)}ms`);
    console.log(`2-Phase Parallel duration (2 x ${DELAY_MS}ms): ${durationPar.toFixed(2)}ms`);

    // Expected ~350ms vs ~100ms
    expect(durationPar).toBeLessThan(durationSeq * 0.6);
  });

  it("deletes child tables first, then parent tables", async () => {
    const executionOrder: string[] = [];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      return {
        delete: () => ({
          not: async () => {
            executionOrder.push(table);
            return { error: null };
          },
        }),
      } as ReturnType<typeof supabase.from>;
    });

    await clearAccountDataFn();

    expect(executionOrder.slice(0, 2)).toEqual(expect.arrayContaining(["sales", "entries"]));
    expect(executionOrder.slice(2)).toEqual(
      expect.arrayContaining(["accounts", "clients", "owners", "programs", "origem_types"]),
    );
  });

  it("throws error if a deletion fails", async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      return {
        delete: () => ({
          not: async () => {
            if (table === "entries") {
              return { error: new Error("Deletion failed") };
            }
            return { error: null };
          },
        }),
      } as ReturnType<typeof supabase.from>;
    });

    await expect(clearAccountDataFn()).rejects.toThrow("Deletion failed");
  });
});
