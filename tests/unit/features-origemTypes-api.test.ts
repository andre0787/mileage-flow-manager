import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { origemTypesApi } from "@/features/origemTypes/origemTypesApi";
import type { OrigemType } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const makeOrigemType = (): OrigemType => ({
  id: "ot-1",
  name: "Compra de pontos",
  accountType: "pontos",
  color: "#3b82f6",
});

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("origemTypesApi — getOrigemTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no user", async () => {
    const result = await makeStore().dispatch(origemTypesApi.endpoints.getOrigemTypes.initiate(""));
    expect(result.data).toEqual([]);
  });

  it("maps the rows via mapOrigemType", async () => {
    const rows = [
      {
        id: "ot-1",
        user_id: "user-1",
        name: "Compra de pontos",
        account_type: "pontos",
        color: "#3b82f6",
      },
    ];
    mockFrom.mockReturnValue({ select: () => Promise.resolve({ data: rows, error: null }) });

    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.getOrigemTypes.initiate("user-1"),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data![0]).toMatchObject({
      id: "ot-1",
      name: "Compra de pontos",
      accountType: "pontos",
      color: "#3b82f6",
    });
    expect(mockFrom).toHaveBeenCalledWith("origem_types");
  });

  it("propagates supabase error", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });
    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.getOrigemTypes.initiate("user-1"),
    );
    expect(result.error).toBeDefined();
  });
});

describe("origemTypesApi — addOrigemType", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts the origemType with user_id", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "origem_types") {
        return { insert };
      }
      return {};
    });

    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.addOrigemType.initiate(makeOrigemType()),
    );
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ot-1",
        user_id: "user-1",
        name: "Compra de pontos",
        account_type: "pontos",
        color: "#3b82f6",
      }),
    );
  });

  it("propagates insertion error", async () => {
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: { message: "db down" } }) });
    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.addOrigemType.initiate(makeOrigemType()),
    );
    expect(result.error).toBeDefined();
  });
});

describe("origemTypesApi — updateOrigemType", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the origemType converting camelCase to snake_case", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "origem_types") {
        return { update };
      }
      return {};
    });

    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.updateOrigemType.initiate({ id: "ot-1", name: "Novo Nome" }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo Nome" }));
  });

  it("propagates error when the origemType does not exist", async () => {
    mockFrom.mockReturnValue({
      update: () => Promise.resolve({ error: { message: "not found" } }),
    });
    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.updateOrigemType.initiate({ id: "missing", name: "Test" }),
    );
    expect(result.error).toBeDefined();
  });
});

describe("origemTypesApi — deleteOrigemType", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the origemType", async () => {
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockImplementation((table: string) => {
      if (table === "origem_types") {
        return { delete: del };
      }
      return {};
    });

    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.deleteOrigemType.initiate("ot-1"),
    );
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
  });

  it("propagates deletion error", async () => {
    mockFrom.mockReturnValue({ delete: () => Promise.resolve({ error: { message: "del fail" } }) });
    const result = await makeStore().dispatch(
      origemTypesApi.endpoints.deleteOrigemType.initiate("ot-1"),
    );
    expect(result.error).toBeDefined();
  });
});
