/**
 * Módulo de operações de saldo de contas.
 * Funções PURAS para calcular novo estado após operações.
 * Toda mutation que altera saldo deve usar estas funções.
 */
import { calcAverageCostPerMile, calcProportionalCost } from "./metrics";

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

/**
 * Adiciona saldo e investimento a uma conta (ex: entrada de milhas).
 */
export function addToAccount(
  currentBalance: number,
  currentTotalInvested: number,
  amountToAdd: number,
  amountToInvest: number,
): AccountBalanceState {
  return calcAccountUpdate(currentBalance, currentTotalInvested, amountToAdd, amountToInvest);
}

/**
 * Remove saldo e investimento proporcional de uma conta (ex: venda).
 * O investimento proporcional é calculado com base no custo médio atual.
 */
export function deductFromAccount(
  currentBalance: number,
  currentTotalInvested: number,
  amountToRemove: number,
  currentAverageCost?: number,
): AccountBalanceState {
  const proportionalInvested = currentAverageCost
    ? currentAverageCost * amountToRemove
    : calcProportionalCost(amountToRemove, currentBalance, currentTotalInvested);
  return calcAccountUpdate(
    currentBalance,
    currentTotalInvested,
    -amountToRemove,
    -proportionalInvested,
  );
}

/**
 * Reverte uma dedução anterior, restaurando saldo e investimento.
 */
export function restoreToAccount(
  currentBalance: number,
  currentTotalInvested: number,
  amountToRestore: number,
  investedToRestore: number,
): AccountBalanceState {
  return calcAccountUpdate(
    currentBalance,
    currentTotalInvested,
    amountToRestore,
    investedToRestore,
  );
}
