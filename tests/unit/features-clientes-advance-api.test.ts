import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { clientesApi } from "@/features/clientes/clientesApi";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("addClientAdvance (adiantamento sem venda)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("insere earn com sale_id null e nota no ledger", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.addClientAdvance.initiate({
        clientId: "client-1",
        amount: 500,
        note: "PIX recebido",
      }),
    );

    expect(result.data).toEqual({ amount: 500 });
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-1",
      client_id: "client-1",
      sale_id: null,
      kind: "earn",
      amount: 500,
      note: "PIX recebido",
    });
  });

  it("rejeita valor inválido sem tocar no banco", async () => {
    const insert = vi.fn();
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.addClientAdvance.initiate({
        clientId: "client-1",
        amount: 0,
      }),
    );

    expect(result.error).toBeDefined();
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejeita cliente não informado", async () => {
    const insert = vi.fn();
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.addClientAdvance.initiate({
        clientId: "",
        amount: 100,
      }),
    );

    expect(result.error).toBeDefined();
    expect(insert).not.toHaveBeenCalled();
  });

  it("propaga erro do Supabase", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "RLS violada" } });
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.addClientAdvance.initiate({
        clientId: "client-1",
        amount: 100,
      }),
    );

    expect(result.error).toBeDefined();
  });
});
