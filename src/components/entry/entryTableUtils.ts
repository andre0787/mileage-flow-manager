import type { PointEntry, Account } from "@/types";

export function getSortValue(
  entry: PointEntry,
  col: string,
  accountMap: Map<string, Account>,
  origemNameMap: Map<string, string>,
): unknown {
  switch (col) {
    case "Data":
      return new Date(entry.date).getTime();
    case "Conta":
      return accountMap.get(entry.accountId)?.name ?? "";
    case "Origem":
      return (origemNameMap.get(entry.origemTypeId) ?? entry.origemTypeId).toLowerCase();
    case "Pontos":
      return entry.amount;
    case "Milhas Geradas":
    case "Milhas":
      return entry.milesGenerated ?? entry.amount;
    case "Valor Pago":
      return entry.amountPaid;
    case "Taxa Conv.":
      return entry.conversionRate ?? 0;
    case "Custo/Milha":
      return entry.costPerMile ?? 0;
    default:
      return "";
  }
}
