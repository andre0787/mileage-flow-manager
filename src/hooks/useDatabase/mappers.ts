import type {
  Owner,
  Program,
  OrigemType,
  Account,
  PointEntry,
  Sale,
  SaleKind,
  ServiceType,
  Client,
  ClientCredit,
} from "@/types";
import { parseDescription } from "@/types";
import type { Database } from "@/lib/supabase-types";
import { parseSaleCosts } from "@/lib/saleCosts";

export function mapOwner(row: Database["public"]["Tables"]["owners"]["Row"]): Owner {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf ?? "",
    phone: row.phone ?? "",
    color: row.color ?? null,
  };
}

export function mapProgram(row: Database["public"]["Tables"]["programs"]["Row"]): Program {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    maxPassengers: row.max_passengers ?? undefined,
    passengerCycleType: row.passenger_cycle_type ?? undefined,
    passengerCycleDays: row.passenger_cycle_days ?? undefined,
  };
}

export function mapOrigemType(
  row: Database["public"]["Tables"]["origem_types"]["Row"],
): OrigemType {
  return {
    id: row.id,
    name: row.name,
    accountType: row.account_type,
    color: row.color,
    description: row.description ?? undefined,
  };
}

export function mapAccount(row: Database["public"]["Tables"]["accounts"]["Row"]): Account {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    programId: row.program_id,
    type: row.type,
    balance: Number(row.balance),
    averageCostPerMile:
      row.average_cost_per_mile != null ? Number(row.average_cost_per_mile) : undefined,
    totalInvested: row.total_invested != null ? Number(row.total_invested) : undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapEntry(row: Database["public"]["Tables"]["entries"]["Row"]): PointEntry {
  const parsed = parseDescription(row.description);
  return {
    id: row.id,
    accountId: row.account_id,
    origemTypeId: row.origem_type_id,
    amount: Number(row.amount),
    amountPaid: Number(row.amount_paid),
    costPerThousand: Number(row.cost_per_thousand),
    date: row.date,
    conversionRate: row.conversion_rate ?? undefined,
    milesGenerated: row.miles_generated ?? undefined,
    costPerMile: row.cost_per_mile ?? undefined,
    sourceAccountId: row.source_account_id ?? undefined,
    bonusPercent: row.bonus_percent ?? undefined,
    cartAmount: parsed.cartAmount,
    cartCost: parsed.cartCost,
    description: row.description ?? undefined,
    entryStatus: parsed.entryStatus,
    parentEntryId: parsed.parentEntryId,
    recurrenceInterval: parsed.recurrenceInterval,
    recurrenceEnd: parsed.recurrenceEnd,
  };
}

export function mapClient(row: Database["public"]["Tables"]["clients"]["Row"]): Client {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    telegram: row.telegram ?? "",
    totalPurchases: row.total_purchases ?? 0,
    usageHistory: row.usage_history ?? [],
  };
}

export function mapClientCredit(
  row: Database["public"]["Tables"]["client_credit_movements"]["Row"],
): ClientCredit {
  return {
    id: row.id,
    clientId: row.client_id,
    saleId: row.sale_id ?? undefined,
    kind: row.kind,
    reversalOf: row.reversal_of ?? undefined,
    amount: Number(row.amount),
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapSale(row: Database["public"]["Tables"]["sales"]["Row"]): Sale {
  const costs = parseSaleCosts((row as { additional_costs?: unknown }).additional_costs);
  const received = Number((row as { amount_received?: unknown }).amount_received ?? 0);
  return {
    id: row.id,
    accountId: row.account_id ?? undefined,
    accountName: row.account_name ?? "",
    ownerName: row.owner_name ?? "",
    program: row.program,
    clientId: row.client_id,
    clientName: row.client_name,
    milesUsed: Number(row.miles_used),
    saleValue: Number(row.sale_value),
    pricePerMile: row.price_per_mile ?? undefined,
    costPerMile: Number(row.cost_per_mile),
    additionalCost: row.additional_cost ?? undefined,
    additionalCostDesc: row.additional_cost_desc ?? undefined,
    additionalCosts: costs.length > 0 ? costs : undefined,
    amountReceived: Number.isFinite(received) ? received : 0,
    profit: Number(row.profit),
    profitMargin: Number(row.profit_margin),
    status: row.status,
    kind: ((row as { sale_kind?: unknown }).sale_kind ?? "milhas") as SaleKind,
    serviceType:
      ((row as { service_type?: unknown }).service_type as ServiceType | undefined) ?? undefined,
    observations:
      ((row as { observations?: unknown }).observations as string | undefined) ?? undefined,
    ticketLocator: row.ticket_locator ?? undefined,
    passengers: row.passengers ?? [],
    date: row.date,
  };
}
