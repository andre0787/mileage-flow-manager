import { computeTransferCalc } from "@/lib/transferCalc";
import { isTransferencia } from "@/lib/utils";
import type { EntryFormData, OrigemType } from "@/types";

export interface ComputedEntryValues {
  isTransfer: boolean;
  amount: number;
  cartAmount: number;
  amountPaid: number;
  cartCost: number;
  conversionRate: number;
  bonusPercent: number | undefined;
  totalAmount: number;
  totalPaid: number;
  milesGenerated: number;
  costPerThousand: number;
  costPerMile: number;
}

/**
 * Calcula todos os valores de uma entrada/transferência a partir do form.
 * Carrinho só participa quando há pontos extras (cartAmount > 0).
 * Em não-transferências (EntryForm) cartAmount/cartCost são sempre 0.
 * Função PURA — mesma semântica do computeFromForm original do Entradas.
 */
export function computeEntryValues(
  form: EntryFormData,
  origemTypes: OrigemType[],
): ComputedEntryValues {
  const ot = origemTypes.find((ot) => ot.id === form.origemTypeId);
  const isTransfer = ot ? isTransferencia(ot) : false;
  const amount = parseFloat(form.amount);
  const cartAmount = parseFloat(form.cartAmount || "0");
  const amountPaid = parseFloat(form.amountPaid);
  const cartCost = parseFloat(form.cartCost || "0");
  const conversionRate = parseFloat(form.conversionRate || "1");
  const bonusPercent = isTransfer ? parseFloat(form.bonusPercent || "0") : undefined;
  const c = computeTransferCalc({
    amount,
    cartAmount: isTransfer ? cartAmount : 0,
    amountPaid,
    cartCost: isTransfer && cartAmount > 0 ? cartCost : 0,
    conversionRate,
    bonusPercent,
  });
  return {
    isTransfer,
    amount,
    cartAmount,
    amountPaid,
    cartCost,
    conversionRate,
    bonusPercent,
    totalAmount: c.totalAmount,
    totalPaid: c.totalPaid,
    milesGenerated: c.milesGenerated,
    costPerThousand: c.costPerThousand,
    costPerMile: c.costPerMile,
  };
}
