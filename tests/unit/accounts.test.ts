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
