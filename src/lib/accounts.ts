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
