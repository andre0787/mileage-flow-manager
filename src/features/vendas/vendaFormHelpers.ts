import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import type { SaleFormData } from "@/components/SaleForm";
import type { Sale } from "@/types";

export function sumAdditionalCosts(data: SaleFormData): {
  total: number;
  items: { desc: string; amount: number }[];
} {
  const items = (data.additionalCosts ?? [])
    .map((c) => ({ desc: c.desc.trim(), amount: parseFloat(c.amount) || 0 }))
    .filter((c) => c.amount > 0);
  if (items.length > 0) return { total: items.reduce((s, c) => s + c.amount, 0), items };
  const legacy = parseFloat(data.additionalCost || "0") || 0;
  return legacy > 0
    ? { total: legacy, items: [{ desc: data.additionalCostDesc.trim(), amount: legacy }] }
    : { total: 0, items: [] };
}

export function buildCreateSaleInput(
  data: SaleFormData,
): Omit<Sale, "id" | "createdAt" | "updatedAt"> & { id?: string } {
  if (data.kind === "servico") {
    const saleValue = parseFloat(data.saleValue);
    return {
      id: crypto.randomUUID(),
      kind: "servico",
      serviceType: data.serviceType as "consultoria" | "taxa" | "outro",
      observations: (data.observations ?? "").trim() || undefined,
      accountId: undefined,
      ownerName: "",
      accountName: "",
      program: "",
      clientId: data.clientId,
      clientName: data.clientName,
      milesUsed: 0,
      saleValue,
      pricePerMile: undefined,
      additionalCost: undefined,
      additionalCostDesc: undefined,
      additionalCosts: [],
      amountReceived: 0,
      costPerMile: 0,
      profit: saleValue,
      profitMargin: 100,
      includeInRoi: data.includeInRoi ?? true,
      status: "pendente" as const,
      ticketLocator: "",
      passengers: [],
      date: data.date,
    };
  }

  const milesUsed = parseFloat(data.milesUsed);
  const saleValue = parseFloat(data.saleValue);
  const { total: additionalCost, items: additionalCosts } = sumAdditionalCosts(data);
  const costPerMile = data.costPerMile ?? 0;
  const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
  const profitMargin = calcProfitMargin(profit, saleValue);

  return {
    id: crypto.randomUUID(),
    kind: "milhas",
    accountId: data.accountId,
    ownerName: data.ownerName,
    accountName: data.accountName,
    program: data.program,
    clientId: data.clientId,
    clientName: data.clientName,
    milesUsed,
    saleValue,
    pricePerMile: parseFloat(data.pricePerMile) || undefined,
    additionalCost: additionalCost || undefined,
    additionalCostDesc: additionalCosts[0]?.desc || undefined,
    additionalCosts,
    amountReceived: 0,
    costPerMile,
    profit,
    profitMargin,
    includeInRoi: data.includeInRoi ?? true,
    status: "pendente" as const,
    ticketLocator: data.ticketLocator,
    passengers: data.passengers.filter((p) => p.name.trim()),
    date: data.date,
  };
}

export function buildUpdateSaleInput(
  editingSale: Sale,
  data: SaleFormData,
): Partial<Sale> & { id: string } {
  if (editingSale.kind === "servico") {
    const saleValue = parseFloat(data.saleValue);
    return {
      id: editingSale.id,
      saleValue,
      serviceType: data.serviceType as "consultoria" | "taxa" | "outro",
      observations: (data.observations ?? "").trim(),
      clientId: data.clientId,
      clientName: data.clientName,
      amountReceived: Math.min(editingSale.amountReceived ?? 0, saleValue),
      profit: saleValue,
      profitMargin: 100,
      includeInRoi: data.includeInRoi ?? true,
      date: data.date,
    };
  }

  const milesUsed = parseFloat(data.milesUsed);
  const saleValue = parseFloat(data.saleValue);
  const { total: additionalCost, items: additionalCosts } = sumAdditionalCosts(data);
  const costPerMile = data.costPerMile ?? 0;
  const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
  const profitMargin = calcProfitMargin(profit, saleValue);

  return {
    id: editingSale.id,
    accountId: data.accountId,
    accountName: data.accountName,
    ownerName: data.ownerName,
    program: data.program,
    clientId: data.clientId,
    clientName: data.clientName,
    milesUsed,
    saleValue,
    pricePerMile: parseFloat(data.pricePerMile) || undefined,
    additionalCost: additionalCost || undefined,
    additionalCostDesc: additionalCosts[0]?.desc || undefined,
    additionalCosts,
    amountReceived: Math.min(editingSale.amountReceived ?? 0, saleValue),
    costPerMile,
    profit,
    profitMargin,
    includeInRoi: data.includeInRoi ?? true,
    ticketLocator: data.ticketLocator,
    passengers: data.passengers.filter((p) => p.name.trim()),
    date: data.date,
  };
}

export function mapSaleToInitialFormData(sale: Sale | null): SaleFormData | undefined {
  if (!sale) return undefined;
  return {
    ownerName: sale.ownerName,
    accountId: sale.accountId ?? "",
    accountName: sale.accountName,
    program: sale.program,
    clientId: sale.clientId,
    clientName: sale.clientName,
    milesUsed: sale.milesUsed.toString(),
    pricePerMile: sale.pricePerMile?.toString() ?? "",
    saleValue: sale.saleValue.toString(),
    additionalCost: sale.additionalCost?.toString() ?? "",
    additionalCostDesc: sale.additionalCostDesc ?? "",
    additionalCosts:
      sale.additionalCosts && sale.additionalCosts.length > 0
        ? sale.additionalCosts.map((c) => ({
            desc: c.desc,
            amount: String(c.amount),
          }))
        : sale.additionalCost
          ? [
              {
                desc: sale.additionalCostDesc ?? "",
                amount: String(sale.additionalCost),
              },
            ]
          : [{ desc: "", amount: "" }],
    ticketLocator: sale.ticketLocator,
    passengers: sale.passengers,
    costPerMile: sale.costPerMile,
    includeInRoi: sale.includeInRoi ?? true,
    kind: sale.kind ?? "milhas",
    serviceType: sale.serviceType ?? "",
    observations: sale.observations ?? "",
    date: sale.date,
  };
}
