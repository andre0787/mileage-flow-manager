import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { ownersApi } from "@/features/owners/ownersApi";
import { selectAllOwners } from "@/features/owners/adapter";
import type { Owner } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const makeOwner = (): Owner => ({
  id: "owner-1",
  name: "André Luiz",
  cpf: "123.456.789-00",
  phone: "(11) 99999-0000",
  color: "#ff0000",
});

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("ownersApi — getOwners", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapeia as linhas de owners via mapOwner", async () => {
    const rows = [
      {
        id: "owner-1",
        user_id: "user-1",
        name: "André Luiz",
        cpf: "123.456.789-00",
        phone: "(11) 99999-0000",
      },
    ];
    mockFrom.mockReturnValue({ select: () => Promise.resolve({ data: rows, error: null }) });

    const result = await makeStore().dispatch(ownersApi.endpoints.getOwners.initiate("user-1"));
    expect(selectAllOwners(result.data!)).toHaveLength(1);
    expect(selectAllOwners(result.data!)[0]).toMatchObject({
      id: "owner-1",
      name: "André Luiz",
      cpf: "123.456.789-00",
      phone: "(11) 99999-0000",
    });
    expect(mockFrom).toHaveBeenCalledWith("owners");
  });

  it("retorna lista vazia sem userId", async () => {
    const result = await makeStore().dispatch(ownersApi.endpoints.getOwners.initiate(""));
    expect(selectAllOwners(result.data!)).toEqual([]);
  });

  it("propaga erro do supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => Promise.resolve({ data: null, error: { message: "boom" } }),
    });
    const result = await makeStore().dispatch(ownersApi.endpoints.getOwners.initiate("user-1"));
    expect(result.error).toBeDefined();
  });
});

describe("ownersApi — addOwner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("insere o dono com user_id", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(ownersApi.endpoints.addOwner.initiate(makeOwner()));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "owner-1",
        user_id: "user-1",
        name: "André Luiz",
        cpf: "123.456.789-00",
        phone: "(11) 99999-0000",
        color: "#ff0000",
      }),
    );
  });

  it("propaga erro de inserção", async () => {
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: { message: "db down" } }) });
    const result = await makeStore().dispatch(ownersApi.endpoints.addOwner.initiate(makeOwner()));
    expect(result.error).toBeDefined();
  });
});

describe("ownersApi — updateOwner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza o dono por id", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({ update });

    const result = await makeStore().dispatch(
      ownersApi.endpoints.updateOwner.initiate({ id: "owner-1", name: "Novo Nome" }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: "Novo Nome" }));
  });

  it("propaga erro de atualização", async () => {
    mockFrom.mockReturnValue({
      update: () => ({ eq: () => Promise.resolve({ error: { message: "db down" } }) }),
    });
    const result = await makeStore().dispatch(
      ownersApi.endpoints.updateOwner.initiate({ id: "owner-1", name: "Novo" }),
    );
    expect(result.error).toBeDefined();
  });
});

describe("ownersApi — deleteOwner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deleta o dono por id", async () => {
    const del = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({ delete: del });

    const result = await makeStore().dispatch(ownersApi.endpoints.deleteOwner.initiate("owner-1"));
    expect(result.data).toBeNull();
    expect(del).toHaveBeenCalled();
  });

  it("propaga erro de exclusão", async () => {
    mockFrom.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: { message: "db down" } }) }),
    });
    const result = await makeStore().dispatch(ownersApi.endpoints.deleteOwner.initiate("owner-1"));
    expect(result.error).toBeDefined();
  });
});

describe("ownersApi — invalidação", () => {
  it("declara invalidação de owners em todos os endpoints", async () => {
    const { readFileSync } = await import("node:fs");
    const source = ["addOwner", "updateOwner", "deleteOwner"]
      .map((name) => readFileSync(`src/features/owners/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["owners"\]/g)).toHaveLength(3);
  });
});
