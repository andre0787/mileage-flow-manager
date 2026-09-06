/**
 * A receber por conta — soma de (saleValue − amountReceived) das vendas
 * não-canceladas, por accountId. Ponto único da fórmula (não duplicar).
 */
import type { Sale } from "@/types";

type ReceivableSale = Pick<Sale, "accountId" | "status" | "saleValue" | "amountReceived">;

export function computeReceivablesByAccount(sales: ReceivableSale[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sales) {
    if (s.status === "cancelado") continue;
    if (!s.accountId) continue;
    const pending = Math.max(0, (Number(s.saleValue) || 0) - (Number(s.amountReceived) || 0));
    if (pending <= 0) continue;
    map.set(s.accountId, (map.get(s.accountId) ?? 0) + pending);
  }
  return map;
}
