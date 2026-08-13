import { parseDateOnly } from "@/lib/dateUtils";
import { isTransferencia } from "@/lib/utils";
import type { Account, OrigemType, PointEntry, Sale } from "@/types";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const computeMonthlySales = (
  sales: Sale[],
): { month: string; vendas: number; lucro: number }[] => {
  const monthMap = new Map<string, { vendas: number; lucro: number }>();
  sales
    .filter((s) => s.status !== "cancelado")
    .forEach((s) => {
      const d = parseDateOnly(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const current = monthMap.get(key) ?? { vendas: 0, lucro: 0 };
      current.vendas += s.saleValue;
      current.lucro += s.profit;
      monthMap.set(key, current);
    });
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, data]) => {
      const [yearStr, monthStr] = key.split("-");
      return {
        month: `${MONTH_NAMES[parseInt(monthStr)]}/${yearStr.slice(2)}`,
        vendas: data.vendas,
        lucro: data.lucro,
      };
    });
};

export interface RecentSaleRow {
  id: string;
  owner: string;
  client: string;
  program: string;
  miles: number;
  value: number;
  status: string;
  statusColor: "default" | "destructive" | "outline" | "secondary";
}

export const computeRecentSales = (sales: Sale[]): RecentSaleRow[] =>
  [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      owner: s.ownerName,
      client: s.clientName,
      program: s.program,
      miles: s.milesUsed,
      value: s.saleValue,
      status:
        s.status === "concluido"
          ? "Concluído"
          : s.status === "pago"
            ? "Pago"
            : s.status === "cancelado"
              ? "Cancelado"
              : "Pendente",
      statusColor: (s.status === "concluido"
        ? "default"
        : s.status === "pago"
          ? "secondary"
          : s.status === "cancelado"
            ? "destructive"
            : "outline") as RecentSaleRow["statusColor"],
    }));

export const computeRecentEntries = (
  entries: PointEntry[],
  accounts: Account[],
): { id: string; amount: number; accountName: string }[] =>
  [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map((e) => ({
      id: e.id,
      amount: e.amount,
      accountName: accounts.find((a) => a.id === e.accountId)?.name ?? "",
    }));

export interface TransferRow {
  id: string;
  date: string;
  sourceAccountName: string;
  pointsDebited: number;
  bonusPercent?: number;
  milesReceived: number;
  destAccountName: string;
}

export const computeRecentTransfers = (
  entries: PointEntry[],
  accounts: Account[],
  origemTypes: OrigemType[],
): TransferRow[] => {
  const transferOrigemIds = new Set(
    origemTypes.filter((ot) => isTransferencia(ot)).map((ot) => ot.id),
  );
  return [...entries]
    .filter((e) => e.sourceAccountId && transferOrigemIds.has(e.origemTypeId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((e) => ({
      id: e.id,
      date: e.date,
      sourceAccountName: accounts.find((a) => a.id === e.sourceAccountId)?.name ?? "",
      pointsDebited: e.amount,
      bonusPercent: e.bonusPercent,
      milesReceived: e.milesGenerated ?? e.amount,
      destAccountName: accounts.find((a) => a.id === e.accountId)?.name ?? "",
    }));
};
