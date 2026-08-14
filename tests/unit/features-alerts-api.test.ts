import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/features/api/baseApi";
import { alertsApi } from "@/features/alerts/alertsApi";
import { selectAllAlerts } from "@/features/alerts/adapter";

const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "user-1" } }, error: null }) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const ALERT_ROW = {
  id: "al-1",
  account_id: "acc-1",
  user_id: "user-1",
  date: "2026-08-10",
  observation: "Renovar clube",
  read: false,
  created_at: "2026-08-07T10:00:00.000Z",
};

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe("alertsApi — getAccountAlerts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca alertas e mapeia para camelCase", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: [ALERT_ROW], error: null }),
      }),
    });
    const result = await makeStore().dispatch(
      alertsApi.endpoints.getAccountAlerts.initiate("user-1"),
    );
    expect(selectAllAlerts(result.data!)).toEqual([
      {
        id: "al-1",
        accountId: "acc-1",
        userId: "user-1",
        date: "2026-08-10",
        observation: "Renovar clube",
        read: false,
        createdAt: "2026-08-07T10:00:00.000Z",
      },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("account_alerts");
  });

  it("ordena por date descendente", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue({ select: () => ({ order }) });
    await makeStore().dispatch(alertsApi.endpoints.getAccountAlerts.initiate("user-1"));
    expect(order).toHaveBeenCalledWith("date", { ascending: false });
  });

  it("retorna vazio quando não há usuário", async () => {
    const result = await makeStore().dispatch(alertsApi.endpoints.getAccountAlerts.initiate(""));
    expect(selectAllAlerts(result.data!)).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("propaga erro do supabase", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: null, error: { message: "boom" } }),
      }),
    });
    const result = await makeStore().dispatch(
      alertsApi.endpoints.getAccountAlerts.initiate("user-1"),
    );
    expect(result.error).toBeDefined();
  });
});

describe("alertsApi — addAccountAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("insere o alerta com user_id e read false (snake_case)", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert });

    const result = await makeStore().dispatch(
      alertsApi.endpoints.addAccountAlert.initiate({
        accountId: "acc-1",
        date: "2026-08-10",
        observation: "Renovar clube",
      }),
    );
    expect(result.data).toBeNull();
    expect(insert).toHaveBeenCalledWith({
      account_id: "acc-1",
      user_id: "user-1",
      date: "2026-08-10",
      observation: "Renovar clube",
      read: false,
    });
  });

  it("propaga erro de inserção", async () => {
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: { message: "db down" } }) });
    const result = await makeStore().dispatch(
      alertsApi.endpoints.addAccountAlert.initiate({
        accountId: "acc-1",
        date: "2026-08-10",
        observation: "x",
      }),
    );
    expect(result.error).toBeDefined();
  });

  it("propaga erro quando não autenticado", async () => {
    vi.mocked(mockFrom);
    const supabaseMock = await import("@/lib/supabase");
    supabaseMock.supabase.auth.getUser = () =>
      Promise.resolve({ data: { user: null }, error: null }) as never;
    mockFrom.mockReturnValue({ insert: () => Promise.resolve({ error: null }) });

    const result = await makeStore().dispatch(
      alertsApi.endpoints.addAccountAlert.initiate({
        accountId: "acc-1",
        date: "2026-08-10",
        observation: "x",
      }),
    );
    expect(result.error).toBeDefined();
  });
});

describe("alertsApi — toggleAccountAlert", () => {
  beforeEach(() => vi.clearAllMocks());

  it("atualiza read por id", async () => {
    const update = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    mockFrom.mockReturnValue({ update });

    const result = await makeStore().dispatch(
      alertsApi.endpoints.toggleAccountAlert.initiate({ id: "al-1", read: true }),
    );
    expect(result.data).toBeNull();
    expect(update).toHaveBeenCalledWith({ read: true });
  });

  it("propaga erro de update", async () => {
    mockFrom.mockReturnValue({
      update: () => ({ eq: () => Promise.resolve({ error: { message: "boom" } }) }),
    });
    const result = await makeStore().dispatch(
      alertsApi.endpoints.toggleAccountAlert.initiate({ id: "al-1", read: true }),
    );
    expect(result.error).toBeDefined();
  });

  it("declara invalidação de alerts em todos os endpoints", async () => {
    const { readFileSync } = await import("node:fs");
    const source = ["addAccountAlert", "toggleAccountAlert"]
      .map((name) => readFileSync(`src/features/alerts/${name}.ts`, "utf8"))
      .join("\n");
    expect(source.match(/invalidatesTags: \["alerts"\]/g)).toHaveLength(2);
  });
});
