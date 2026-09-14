/**
 * Módulo de operações de saldo de contas.
 * Funções PURAS para calcular novo estado após operações.
 * Toda mutation que altera saldo deve usar estas funções.
 */
import { calcAverageCostPerMile } from "./metrics";

export interface AccountBalanceState {
  balance: number;
  total_invested: number;
  average_cost_per_mile: number;
}

/**
 * Calcula o novo estado da conta após um delta de saldo e investimento.
 * Garante que balance e totalInvested nunca fiquem negativos.
 */
export function calcAccountUpdate(
  currentBalance: number,
  currentTotalInvested: number,
  balanceDelta: number,
  investedDelta: number,
): AccountBalanceState {
  const newBalance = Math.max(0, currentBalance + balanceDelta);
  const newTotalInvested = Math.max(0, currentTotalInvested + investedDelta);
  return {
    balance: newBalance,
    total_invested: newTotalInvested,
    average_cost_per_mile: calcAverageCostPerMile(newTotalInvested, newBalance),
  };
}

// addToAccount, deductFromAccount, restoreToAccount removidos — sem chamadores,
// são wrappers simples sobre calcAccountUpdate.

export interface BalanceAccountInput {
  id: string;
}

export interface BalanceEntryInput {
  accountId?: string | null;
  sourceAccountId?: string | null;
  entryStatus?: string | null;
  milesGenerated?: number | null;
  amount: number;
}

export interface BalanceSaleInput {
  accountId?: string | null;
  status: string;
  milesUsed: number;
}

/**
 * Fonte da verdade: saldo calculado de entradas confirmadas - transferências enviadas - vendas ativas.
 * Agrupa as entradas e vendas em Maps em tempo O(E + S + N), eliminando os `.filter()`
 * dentro do loop de contas O(N * (E + S)).
 */
export function computeBalancesByAccount<
  A extends BalanceAccountInput,
  E extends BalanceEntryInput,
  S extends BalanceSaleInput,
>(accounts: A[], entries: E[], sales: S[]): Map<string, number> {
  const entriesMap = new Map<string, number>();
  const transfersOutMap = new Map<string, number>();
  const salesMap = new Map<string, number>();

  for (const e of entries) {
    if (e.entryStatus !== "aguardando") {
      if (e.accountId) {
        const generated = e.milesGenerated ?? e.amount;
        entriesMap.set(e.accountId, (entriesMap.get(e.accountId) ?? 0) + generated);
      }
      if (e.sourceAccountId) {
        transfersOutMap.set(
          e.sourceAccountId,
          (transfersOutMap.get(e.sourceAccountId) ?? 0) + e.amount,
        );
      }
    }
  }

  for (const s of sales) {
    if (s.status !== "cancelado" && s.accountId) {
      salesMap.set(s.accountId, (salesMap.get(s.accountId) ?? 0) + s.milesUsed);
    }
  }

  const result = new Map<string, number>();
  for (const a of accounts) {
    const entriesSum = entriesMap.get(a.id) ?? 0;
    const transfersOutSum = transfersOutMap.get(a.id) ?? 0;
    const salesSum = salesMap.get(a.id) ?? 0;
    result.set(a.id, Math.max(0, entriesSum - transfersOutSum - salesSum));
  }
  return result;
}
