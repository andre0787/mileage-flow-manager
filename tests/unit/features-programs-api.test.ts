import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { programsApi } from "@/features/programs/programsApi";
import type { Program } from "@/types";
import { supabase } from "@/lib/supabase";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const makeProgram = (): Program => ({
  id: "prog-1",
  name: "Programa Teste",
  type: "milhas",
  maxPassengers: 2,
  passengerCycleType: "mensal",
  passengerCycleDays: 30,
});

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("programsApi — getPrograms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no user", async () => {
    const result = await makeStore().dispatch(programsApi.endpoints.getPrograms.initiate(""));
    expect(result.data).toEqual([]);
  });

  it("maps the rows via mapProgram", async () => {
    const rows = [
      {
        id: "prog-1",
        user_id: "user-1",
        name: "Programa Teste",
        type: "milhas",
        max_passengers: 2,
        passenger_cycle_type: "mensal",
        passenger_cycle_days: 30,
      },
    ];
    mockFrom.mockReturnValue({ select: () => Promise.resolve({ data: rows, error: null }) });

    const result = await makeStore().dispatch(programsApi.endpoints.getPrograms.initiate("user-1"));
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toMatchObject({
      id: "prog-1",
      name: "Programa Teste",
      type: "milhas",
      maxPassengers: 2,
      passengerCycleType: "mensal",
      passengerCycleDays: 30,
    });
    expect(mockFrom).toHaveBeenCalledWith("programs");
  });

  it("propagates supabase error", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });
    const result = await makeStore().dispatch(programsApi.endpoints.getPrograms.initiate("user-1"));
    expect(result.error).toBeDefined();
  });
});

describe("programsApi — addProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts the program with user_id and upserts origem_type when type is pontos", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { insert };
      }
      if (table === "origem_types") {
        return { upsert };
      }
      return {};
    });

    const programWithPontos = { ...makeProgram(), type: "pontos" };
    const result = await makeStore().dispatch(programsApi.endpoints.addProgram.initiate(programWithPontos));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", type: "pontos" }));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "prog-1",
        user_id: "user-1",
        name: "Programa Teste",
        account_type: "pontos",
        color: "#3b82f6",
      }),
      { onConflict: "id" }
    );
  });

  it("does not upsert origem_type when type is not pontos", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const upsert = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { insert };
      }
      if (table === "origem_types") {
        return { upsert };
      }
      return {};
    });

    const programWithMilhas = { ...makeProgram(), type: "milhas" };
    const result = await makeStore().dispatch(programsApi.endpoints.addProgram.initiate(programWithMilhas));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", type: "milhas" }));
    expect(upsert).not.toHaveBeenCalled();
  });

  it("propagates insertion error", async () => {
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: { message: "db down" } }) });
    const result = await makeStore().dispatch(programsApi.endpoints.addProgram.initiate(makeProgram()));
    expect(result.error).toBeDefined();
  });

  it("propagates upsert error when type is pontos", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const upsert = vi.fn().mockResolvedValue({ error: { message: "upsert failed" } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { insert };
      }
      if (table === "origem_types") {
        return { upsert };
      }
      return {};
    });

    const programWithPontos = { ...makeProgram(), type: "pontos" };
    const result = await makeStore().dispatch(programsApi.endpoints.addProgram.initiate(programWithPontos));
    expect(result.error).toBeDefined();
  });
});

describe("programsApi — updateProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the program converting camelCase to snake_case", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { update };
      }
      return {};
    });

    const result = await makeStore().dispatch(
      programsApi.endpoints.updateProgram.initiate({ id: "prog-1", name: "Novo Nome" }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo Nome" }));
  });

  it("propagates error when the program does not exist", async () => {
    mockFrom.mockReturnValue({
      update: () => Promise.resolve({ error: { message: "not found" } }),
    });
    const result = await makeStore().dispatch(
      programsApi.endpoints.updateProgram.initiate({ id: "missing", name: "Test" }),
    );
    expect(result.error).toBeDefined();
  });
});

describe("programsApi — deleteProgram", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the program", async () => {
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "programs") {
        return { delete: del };
      }
      return {};
    });

    const result = await makeStore().dispatch(programsApi.endpoints.deleteProgram.initiate("prog-1"));
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
  });

  it("propagates deletion error", async () => {
    mockFrom.mockReturnValue({ delete: () => Promise.resolve({ error: { message: "delete failed" } }) });
    const result = await makeStore().dispatch(programsApi.endpoints.deleteProgram.initiate("prog-1"));
    expect(result.error).toBeDefined();
  });
});
