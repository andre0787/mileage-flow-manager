import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import { applyAdditionalCosts } from "@/lib/saleCosts";
import type { VendaUpdate, VendaMutationInput } from "./shared";

/** Linha do banco (snake_case) p/ montagem do payload de update. */
export interface UpdateDbRow {
  sale_value?: unknown;
  miles_used?: unknown;
  cost_per_mile?: unknown;
  additional_cost?: unknown;
  additional_costs?: unknown;
  amount_received?: unknown;
}

/** Monta o payload snake_case + lucro server-side (extraído do updateVenda p/ rule-41). */
export function buildVendaUpdate(oldSale: UpdateDbRow, data: Omit<VendaMutationInput, "id">): VendaUpdate {
  const updateData: VendaUpdate = {};
  if (data.accountId !== undefined) updateData.account_id = data.accountId;
  if (data.accountName !== undefined) updateData.account_name = data.accountName;
  if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
  if (data.program !== undefined) updateData.program = data.program;
  if (data.clientId !== undefined) updateData.client_id = data.clientId;
  if (data.clientName !== undefined) updateData.client_name = data.clientName;
  if (data.milesUsed !== undefined) updateData.miles_used = data.milesUsed;
  if (data.saleValue !== undefined) updateData.sale_value = data.saleValue;
  if (data.pricePerMile !== undefined) updateData.price_per_mile = data.pricePerMile;
  if (data.costPerMile !== undefined) updateData.cost_per_mile = data.costPerMile;
  if (data.additionalCost !== undefined) updateData.additional_cost = data.additionalCost;
  if (data.additionalCostDesc !== undefined)
    updateData.additional_cost_desc = data.additionalCostDesc;
  if (data.additionalCosts !== undefined) {
    applyAdditionalCosts(updateData as Record<string, unknown>, data.additionalCosts);
  }
  const effectiveSaleValue = data.saleValue ?? Number(oldSale.sale_value);
  if (data.amountReceived !== undefined) {
    (updateData as Record<string, unknown>).amount_received = Math.min(
      Math.max(Number(data.amountReceived ?? 0), 0),
      effectiveSaleValue,
    );
  } else if (data.saleValue !== undefined) {
    const oldReceived = Number((oldSale as { amount_received?: unknown }).amount_received ?? 0);
    (updateData as Record<string, unknown>).amount_received = Math.min(
      Math.max(oldReceived, 0),
      effectiveSaleValue,
    );
  }
  // Lucro recalculado server-side — ignora valores do client (anti-forgery).
  const effMiles = data.milesUsed ?? Number(oldSale.miles_used);
  const effCostPerMile = data.costPerMile ?? Number(oldSale.cost_per_mile);
  const oldCostsRaw = (oldSale as { additional_costs?: unknown }).additional_costs;
  const oldCostsSum = Array.isArray(oldCostsRaw)
    ? oldCostsRaw.reduce(
        (s: number, c: unknown) => s + (Number((c as { amount?: unknown }).amount ?? 0) || 0),
        0,
      )
    : Number(oldSale.additional_cost ?? 0);
  const effCostsSum =
    data.additionalCosts !== undefined
      ? (Array.isArray(data.additionalCosts) ? data.additionalCosts : []).reduce(
          (s, c) => s + (Number(c.amount) || 0),
          0,
        )
      : (data.additionalCost ?? oldCostsSum);
  const serverProfit = calcProfit(
    Number(effectiveSaleValue),
    Number(effMiles),
    Number(effCostPerMile),
    Number(effCostsSum),
  );
  updateData.profit = serverProfit;
  updateData.profit_margin = calcProfitMargin(serverProfit, Number(effectiveSaleValue));
  if (data.status !== undefined) updateData.status = data.status as VendaUpdate["status"];
  if (data.serviceType !== undefined)
    (updateData as Record<string, unknown>).service_type = data.serviceType ?? null;
  if (data.observations !== undefined)
    (updateData as Record<string, unknown>).observations = (data.observations ?? "").trim() || null;
  if (data.ticketLocator !== undefined) updateData.ticket_locator = data.ticketLocator;
  if (data.passengers !== undefined) updateData.passengers = data.passengers;
  if (data.date !== undefined) updateData.date = data.date;
  return updateData;
}
