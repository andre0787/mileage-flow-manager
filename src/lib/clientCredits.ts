/**
 * Regras puras do ledger de crédito por cliente — sem React, sem Supabase.
 * Ponto único das fórmulas de crédito (UI e API consomem daqui).
 * Ledger é append-only: saldo é SEMPRE derivado (SUM earn − SUM spend).
 */
import type { ClientCredit } from "@/types";

/** Epsilon monetário (mesmo padrão do amountReceived). */
export const CREDIT_EPSILON = 1e-9;

type CreditLike = Pick<ClientCredit, "kind" | "reversalOf" | "amount">;

/** Efeito assinado de um movimento no saldo: earn soma, spend subtrai. */
export function movementEffect(m: CreditLike): number {
  const amount = Number(m.amount) || 0;
  if (m.kind === "earn") return amount;
  if (m.kind === "spend") return -amount;
  // reversal: inverte o efeito do movimento referenciado.
  return m.reversalOf === "spend" ? amount : -amount;
}

/** Saldo derivado de uma lista de movimentos (poeira de float < epsilon vira 0). */
export function calcCreditBalance(movements: CreditLike[]): number {
  const sum = movements.reduce((total, m) => total + movementEffect(m), 0);
  return Math.abs(sum) < CREDIT_EPSILON ? 0 : sum;
}

function sanitize(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export interface PlanReceiptInput {
  saleValue: number;
  amountReceived: number;
  /** Saldo de crédito do cliente (derivado do ledger). */
  balance: number;
  /** Dinheiro entregue agora. */
  cash: number;
  /** Quanto do saldo abater (0 = não usa crédito). */
  useCredit?: number;
}

export interface PlanReceiptResult {
  /** Dinheiro aplicado no amountReceived (limitado ao pendente restante). */
  appliedCash: number;
  /** Crédito consumido (spend), limitado a min(saldo, pendente). */
  appliedCredit: number;
  /** Excedente em dinheiro que vira crédito (earn). */
  earnedCredit: number;
  newReceived: number;
  fullyPaid: boolean;
}

/**
 * Planeja um recebimento com crédito (spec §5).
 * appliedCredit = min(U, saldo, pendente); o dinheiro preenche o restante do
 * pendente; só o excedente EM DINHEIRO vira earn (crédito nunca gera crédito).
 */
export function planReceipt(input: PlanReceiptInput): PlanReceiptResult {
  const saleValue = Math.max(0, Number(input.saleValue) || 0);
  const received = Math.max(0, Number(input.amountReceived) || 0);
  const balance = Math.max(0, Number(input.balance) || 0);
  const pending = Math.max(0, saleValue - received);
  const appliedCredit = Math.min(sanitize(input.useCredit), balance, pending);
  const remaining = pending - appliedCredit;
  const appliedCash = Math.min(sanitize(input.cash), remaining);
  const earnedCredit = Math.max(0, sanitize(input.cash) - appliedCash);
  const newReceived = Math.min(saleValue, received + appliedCredit + appliedCash);
  return {
    appliedCash,
    appliedCredit,
    earnedCredit,
    newReceived,
    fullyPaid: newReceived >= saleValue - CREDIT_EPSILON,
  };
}

export interface PlannedReversal {
  kind: "reversal";
  reversalOf: "earn" | "spend";
  amount: number;
}

/** Reversões espelhadas dos earn/spend de uma venda (cancelamento). */
export function planCancelReversals(movementsOfSale: CreditLike[]): PlannedReversal[] {
  return movementsOfSale
    .filter((m) => m.kind === "earn" || m.kind === "spend")
    .map((m) => ({
      kind: "reversal" as const,
      reversalOf: m.kind as "earn" | "spend",
      amount: Number(m.amount) || 0,
    }))
    .filter((r) => r.amount > 0);
}
