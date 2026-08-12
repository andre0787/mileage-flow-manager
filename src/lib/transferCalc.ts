/**
 * Cálculos da transferência de pontos → milhas (funções PURAS, sem React).
 *
 * Convenção de custos:
 * - `amountPaid` = custo da transferência (pontos debitados da origem), SEM o carrinho;
 * - `cartCost`   = valor investido nos pontos extras do carrinho;
 * - `totalPaid`  = amountPaid + cartCost (custo total da operação).
 *
 * Histórico (issue #309): o preview do TransferForm usava apenas `amountPaid`
 * para custo por milha/milhar, então digitar o valor do carrinho não alterava
 * nada — e a edição contava o carrinho 2x (amount_paid já incluía cartCost e o
 * form somava cartCost de novo).
 */
import { calcCostPerMile, calcCostPerThousand, calcMilesGenerated } from "./metrics";

export interface TransferCalcInput {
  /** Pontos debitados da conta de origem (transferência pura) */
  amount: number;
  /** Pontos extras comprados no carrinho */
  cartAmount: number;
  /** Custo da transferência (sem carrinho) */
  amountPaid: number;
  /** Valor investido nos pontos extras do carrinho */
  cartCost: number;
  conversionRate: number;
  bonusPercent?: number;
}

export interface TransferCalcResult {
  totalAmount: number;
  totalPaid: number;
  milesGenerated: number;
  costPerThousand: number;
  costPerMile: number;
}

export function computeTransferCalc(input: TransferCalcInput): TransferCalcResult {
  const totalAmount = input.amount + input.cartAmount;
  const totalPaid = input.amountPaid + input.cartCost;
  const milesGenerated = calcMilesGenerated(totalAmount, input.conversionRate, input.bonusPercent);
  return {
    totalAmount,
    totalPaid,
    milesGenerated,
    costPerThousand: calcCostPerThousand(totalPaid, milesGenerated),
    costPerMile: calcCostPerMile(totalPaid, milesGenerated),
  };
}
