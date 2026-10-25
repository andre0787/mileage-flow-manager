import type { Sale } from "@/types";

export function getSaleSortValue(sale: Sale, col: string): unknown {
  switch (col) {
    case "Data":
      return new Date(sale.date).getTime();
    case "Dono":
      return sale.ownerName.toLowerCase();
    case "Programa":
      return (sale.program ?? "").toLowerCase();
    case "Cliente":
      return sale.clientName.toLowerCase();
    case "Milhas":
      return sale.milesUsed;
    case "Valor":
      return sale.saleValue;
    case "Pendente":
      return sale.saleValue - (sale.amountReceived ?? 0);
    case "Lucro":
      return sale.profit;
    case "Margem":
      return sale.profitMargin;
    case "Status":
      return sale.status;
    default:
      return "";
  }
}
