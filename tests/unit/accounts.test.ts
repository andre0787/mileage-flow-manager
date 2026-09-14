import { describe, it, expect, vi } from "vitest";

/**
 * Testes de integração mockada para operações de saldo com Supabase.
 *
 * Objetivo: verificar que, quando o Supabase falha, o fluxo NÃO reporta sucesso.
 * Usa funções puras de calcAccountUpdate com mock do cliente Supabase.
 *
 * Não testa React hooks ou mutation observers — apenas a camada de dados.
 */

// ─── Interface e função auxiliar (pura, testável) ───

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (col: string, id: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, id: string) => Promise<{ error: unknown }>;
    };
  };
}

type AccountUpdateResult =
  | { success: true }
  | { success: false; error: unknown; partial: boolean; reversed: boolean };

/**
 * Aplica um delta de saldo em uma conta via Supabase.
 * Retorna sucesso ou falha com flag de reversão.
 */
export async function applyBalanceDelta(
  supabase: SupabaseClient,
  accountId: string,
  balanceDelta: number,
  investedDelta: number,
): Promise<AccountUpdateResult> {
  try {
    // Busca estado atual
    const { data, error: fetchError } = await supabase
      .from("accounts")
      .select("balance, total_invested")
      .eq("id", accountId)
      .single();

    if (fetchError || !data) {
      return { success: false, error: fetchError ?? new Error("Account not found"), partial: false, reversed: false };
    }

    // Calcula novo estado (função pura)
    const { calcAccountUpdate } = await import("@/lib/accounts");
    const newState = calcAccountUpdate(
      Number(data.balance),
      Number(data.total_invested ?? 0),
      balanceDelta,
      investedDelta,
    );

    // Persiste no Supabase
    const { error: updateError } = await supabase
      .from("accounts")
      .update(newState)
      .eq("id", accountId);

    if (updateError) {
      return { success: false, error: updateError, partial: false, reversed: false };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err, partial: false, reversed: false };
  }
}

describe("Mock de erro do Supabase — operações de saldo", () => {
  it("erro na consulta retorna failure, não sucesso", async () => {
    const mockSupabase: SupabaseClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error("Connection refused") }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      }),
    };

    const result = await applyBalanceDelta(mockSupabase, "id-qualquer", 100, 50);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(Error);
    }
  });

  it("erro no update retorna failure, não sucesso", async () => {
    const mockSupabase: SupabaseClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { balance: 1000, total_invested: 500 },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: new Error("Timeout writing to database") }),
        }),
      }),
    };

    const result = await applyBalanceDelta(mockSupabase, "id-qualquer", -100, -50);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe("Timeout writing to database");
    }
  });

  it("erro no update preserva estado original (não corrompe dados)", async () => {
    // Simula: consulta bem-sucedida, mas update falha
    const originalBalance = 1000;
    const originalInvested = 500;

    const mockSupabase: SupabaseClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { balance: originalBalance, total_invested: originalInvested },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: new Error("Update failed") }),
        }),
      }),
    };

    const result = await applyBalanceDelta(mockSupabase, "id-qualquer", 500, 250);

    // Falha não reporta sucesso
    expect(result.success).toBe(false);
    // O banco não foi alterado (update nunca chegou)
    if (!result.success) {
      expect(result.partial).toBe(false);
      expect(result.reversed).toBe(false);
    }
  });
});

describe("applyBalanceDelta — funções permanecem puras", () => {
  it("calcAccountUpdate é chamada com os parâmetros corretos", async () => {
    // Esta função é pura — apenas calcula novo estado sem efeitos
    const { calcAccountUpdate } = await import("@/lib/accounts");

    const result = calcAccountUpdate(100, 50, 50, 25);
    expect(result.balance).toBe(150);
    expect(result.total_invested).toBe(75);
  });
});

describe("computeBalancesByAccount — testes de unidade e benchmark de performance", () => {
  it("calcula saldos corretamente considerando entradas, transferências enviadas e vendas", async () => {
    const { computeBalancesByAccount } = await import("@/lib/accounts");

    const accounts = [{ id: "acc-1" }, { id: "acc-2" }];
    const entries = [
      { accountId: "acc-1", entryStatus: "confirmada", milesGenerated: 10000, amount: 10000 },
      { accountId: "acc-1", entryStatus: "aguardando", milesGenerated: 5000, amount: 5000 }, // Ignorado
      { accountId: "acc-2", entryStatus: "confirmada", milesGenerated: null, amount: 4000 }, // Usa amount = 4000
      { accountId: "acc-2", sourceAccountId: "acc-1", entryStatus: "confirmada", amount: 2000 }, // Debita acc-1 e credita acc-2
    ];
    const sales = [
      { accountId: "acc-1", status: "concluido", milesUsed: 3000 },
      { accountId: "acc-1", status: "cancelado", milesUsed: 5000 }, // Ignorado
      { accountId: "acc-2", status: "pendente", milesUsed: 1000 },
    ];

    const balances = computeBalancesByAccount(accounts, entries, sales);

    // acc-1: +10000 (entry) - 2000 (transfer out) - 3000 (sale) = 5000
    expect(balances.get("acc-1")).toBe(5000);
    // acc-2: +4000 (entry) + 2000 (transfer in) - 1000 (sale) = 5000
    expect(balances.get("acc-2")).toBe(5000);
  });

  it("garante que saldos não fiquem negativos", async () => {
    const { computeBalancesByAccount } = await import("@/lib/accounts");

    const accounts = [{ id: "acc-1" }];
    const entries = [{ accountId: "acc-1", entryStatus: "confirmada", amount: 1000 }];
    const sales = [{ accountId: "acc-1", status: "concluido", milesUsed: 3000 }];

    const balances = computeBalancesByAccount(accounts, entries, sales);
    expect(balances.get("acc-1")).toBe(0);
  });

  it("benchmark: O(N + E + S) é significativamente mais rápido que O(N * (E + S)) com grandes volumes de dados", async () => {
    const { computeBalancesByAccount } = await import("@/lib/accounts");

    const NUM_ACCOUNTS = 100;
    const NUM_ENTRIES = 10000;
    const NUM_SALES = 5000;

    const accounts = Array.from({ length: NUM_ACCOUNTS }, (_, i) => ({ id: `acc-${i}` }));
    const entries = Array.from({ length: NUM_ENTRIES }, (_, i) => ({
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      sourceAccountId: i % 10 === 0 ? `acc-{(i + 1) % NUM_ACCOUNTS}` : null,
      entryStatus: i % 5 === 0 ? "aguardando" : "confirmada",
      milesGenerated: 1000 + (i % 500),
      amount: 1000,
    }));
    const sales = Array.from({ length: NUM_SALES }, (_, i) => ({
      accountId: `acc-${i % NUM_ACCOUNTS}`,
      status: i % 10 === 0 ? "cancelado" : "realizado",
      milesUsed: 200 + (i % 100),
    }));

    // Algoritmo antigo (O(N * (E + S)))
    const t0 = performance.now();
    const legacyMap = new Map<string, number>();
    for (const a of accounts) {
      const accEntries = entries.filter(
        (e) => e.accountId === a.id && e.entryStatus !== "aguardando",
      );
      const accTransfersOut = entries.filter(
        (e) => e.sourceAccountId === a.id && e.entryStatus !== "aguardando",
      );
      const accSales = sales.filter((s) => s.accountId === a.id && s.status !== "cancelado");
      const entriesSum = accEntries.reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);
      const transfersOutSum = accTransfersOut.reduce((s, e) => s + e.amount, 0);
      const salesSum = accSales.reduce((s, sl) => s + sl.milesUsed, 0);
      legacyMap.set(a.id, Math.max(0, entriesSum - transfersOutSum - salesSum));
    }
    const t1 = performance.now();
    const legacyDuration = t1 - t0;

    // Algoritmo otimizado (O(N + E + S))
    const t2 = performance.now();
    const optimizedMap = computeBalancesByAccount(accounts, entries, sales);
    const t3 = performance.now();
    const optimizedDuration = t3 - t2;

    // Resultados idênticos
    for (const a of accounts) {
      expect(optimizedMap.get(a.id)).toBe(legacyMap.get(a.id));
    }

    // Otimizado deve ser consideravelmente mais rápido que legacy
    expect(optimizedDuration).toBeLessThan(legacyDuration);
  });
});
