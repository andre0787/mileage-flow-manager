import type { Account, Owner } from "@/types";
import type { StockItem } from "@/components/SaleSimulator";

export function computeStockInfo(accounts: Account[], owners: Owner[]): StockItem[] {
  const ownersMap = new Map(owners.map((o) => [o.id, o.name]));
  return accounts
    .filter((a) => a.type === "milhas" && a.status === "ativa")
    .map((a) => ({
      accountId: a.id,
      ownerName: ownersMap.get(a.ownerId) ?? "",
      accountName: a.name,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    }));
}
