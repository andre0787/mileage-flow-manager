import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { clientesApi } from "@/features/clientes/clientesApi";
import { selectAllClients } from "@/features/clientes/adapter";
import type { Client } from "@/types";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } } }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const client: Client = {
  id: "client-1",
  name: "Cliente Azul",
  cpf: "12345678900",
  email: "azul@example.com",
  phone: "11999999999",
  telegram: "@azul",
  totalPurchases: 2,
  usageHistory: [{ program: "Programa", count: 2, year: 2026 }],
};

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("clientesApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta e mapeia clientes", async () => {
    mockFrom.mockReturnValue({
      select: () =>
        Promise.resolve({
          data: [
            {
              ...client,
              cpf: null,
              email: null,
              telegram: null,
              total_purchases: null,
              usage_history: null,
            },
          ],
          error: null,
        }),
    });
    const result = await makeStore().dispatch(clientesApi.endpoints.getClients.initiate("user-1"));
    expect(selectAllClients(result.data!)[0]).toMatchObject({
      ...client,
      cpf: "",
      email: "",
      telegram: "",
      totalPurchases: 0,
      usageHistory: [],
    });
  });

  it("insere cliente com usuário autenticado", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });
    const result = await makeStore().dispatch(clientesApi.endpoints.addClient.initiate(client));
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1" }));
  });

  it("converte campos camelCase ao atualizar", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({ update });
    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClient.initiate({
        id: client.id,
        totalPurchases: 3,
        usageHistory: client.usageHistory,
      }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith({
      total_purchases: 3,
      usage_history: client.usageHistory,
    });
  });

  it("propaga erro de exclusão", async () => {
    mockFrom.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: { message: "db down" } }) }),
    });
    const result = await makeStore().dispatch(
      clientesApi.endpoints.deleteClient.initiate(client.id),
    );
    expect(result.error).toBeDefined();
  });
});
