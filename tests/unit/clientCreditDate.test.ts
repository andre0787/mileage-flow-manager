import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { clientesApi } from "@/features/clientes/clientesApi";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "user-1" } } })) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

function mockLedger(row: unknown, updateError: unknown = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const ueq2 = vi.fn().mockResolvedValue({ error: updateError });
  const ueq1 = vi.fn().mockReturnValue({ eq: ueq2 });
  const update = vi.fn().mockReturnValue({ eq: ueq1 });
  mockFrom.mockReturnValue({ select, update });
  return { select, eqId: eq1, eqUser: eq2, update };
}

describe("updateClientCreditDate (editar data de adiantamento)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza created_at de earn sem venda", async () => {
    const { select, eqId, eqUser, update } = mockLedger({
      id: "mov-1",
      client_id: "client-1",
      kind: "earn",
      sale_id: null,
    });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.data).toEqual({ id: "mov-1" });
    expect(select).toHaveBeenCalledWith("id,client_id,kind,sale_id");
    expect(eqId).toHaveBeenCalledWith("id", "mov-1");
    expect(eqUser).toHaveBeenCalledWith("user_id", "user-1");
    expect(update).toHaveBeenCalledWith({ created_at: "2026-09-05T12:00:00-03:00" });
  });

  it("rejeita data inválida sem tocar no banco", async () => {
    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "client-1",
        date: "2026-13-40",
      }),
    );

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejeita data futura sem tocar no banco", async () => {
    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "client-1",
        date: "2999-01-01",
      }),
    );

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("recusa spend vinculado a venda sem atualizar", async () => {
    const { update } = mockLedger({
      id: "mov-2",
      client_id: "client-1",
      kind: "spend",
      sale_id: "sale-1",
    });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-2",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("recusa earn vinculado a venda sem atualizar", async () => {
    const { update } = mockLedger({
      id: "mov-3",
      client_id: "client-1",
      kind: "earn",
      sale_id: "sale-9",
    });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-3",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("recusa movimento de outro cliente sem atualizar", async () => {
    const { update } = mockLedger({
      id: "mov-4",
      client_id: "client-9",
      kind: "earn",
      sale_id: null,
    });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-4",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("recusa movimento inexistente sem atualizar", async () => {
    const { update } = mockLedger(null);

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-9",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("propaga erro do banco ao atualizar", async () => {
    mockLedger(
      { id: "mov-1", client_id: "client-1", kind: "earn", sale_id: null },
      { message: "boom" },
    );

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("rejeita quando não autenticado", async () => {
    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>);
    const { select } = mockLedger({
      id: "mov-1",
      client_id: "client-1",
      kind: "earn",
      sale_id: null,
    });

    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(select).not.toHaveBeenCalled();
  });

  it("rejeita movimento não informado", async () => {
    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "",
        clientId: "client-1",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejeita cliente não informado", async () => {
    const result = await makeStore().dispatch(
      clientesApi.endpoints.updateClientCreditDate.initiate({
        id: "mov-1",
        clientId: "",
        date: "2026-09-05",
      }),
    );

    expect(result.error).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
