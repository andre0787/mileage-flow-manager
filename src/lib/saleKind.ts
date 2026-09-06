import type { SaleKind, ServiceType } from "@/types";

export interface SaleKindInput {
  kind: SaleKind;
  milesUsed: number;
  accountId?: string | null;
  saleValue: number;
  clientId?: string | null;
  serviceType?: ServiceType | null;
  pricePerMile?: number | null;
  observations?: string | null;
  additionalCosts?: { desc: string; amount: number }[] | null;
}

/**
 * Valida as regras do discriminador milhas|servico (ponto único, puro).
 * Retorna lista de mensagens pt-BR (vazia = válido).
 */
/** Predicado de kind p/ filtros de milhagem — ausente = milhas (linhas antigas/mocks). */
export function isMilesSaleKind(kind?: string | null): boolean {
  return (kind ?? "milhas") === "milhas";
}

/** Origem dos campos p/ montagem do SaleKindInput (payload do add). */
export interface KindAddSource {
  kind?: SaleKind | null;
  milesUsed?: number | null;
  accountId?: string | null;
  saleValue?: number | null;
  clientId?: string | null;
  serviceType?: ServiceType | null;
  pricePerMile?: number | null;
  observations?: string | null;
  additionalCosts?: { desc: string; amount: number }[] | null;
}

/** Monta o SaleKindInput do add a partir do payload (ponto único). */
export function kindInputForAdd(sale: KindAddSource): SaleKindInput {
  return {
    kind: sale.kind ?? "milhas",
    milesUsed: Number(sale.milesUsed ?? 0),
    accountId: sale.accountId ?? null,
    saleValue: Number(sale.saleValue),
    clientId: sale.clientId,
    serviceType: sale.serviceType ?? null,
    pricePerMile: sale.pricePerMile ?? null,
    observations: sale.observations ?? null,
    additionalCosts: sale.additionalCosts ?? null,
  };
}

/** Linha do banco (snake_case) p/ revalidação do estado efetivo no update. */
export interface EffectiveKindDbRow {
  sale_kind?: unknown;
  miles_used?: unknown;
  account_id?: unknown;
  sale_value?: unknown;
  client_id?: unknown;
  service_type?: unknown;
  price_per_mile?: unknown;
  observations?: unknown;
  additional_costs?: unknown;
}

/** Patch parcial do update (camelCase) p/ revalidação do estado efetivo. */
export interface EffectiveKindPatch {
  milesUsed?: unknown;
  accountId?: unknown;
  saleValue?: unknown;
  clientId?: unknown;
  serviceType?: unknown;
  pricePerMile?: unknown;
  observations?: unknown;
  additionalCosts?: unknown;
}

/**
 * Revalida o estado EFETIVO (banco + patch) — mesma regra do addVenda.
 * Sem isso o update corromperia invariantes (serviço ganhando
 * miles/conta, milhas ganhando serviceType/observations).
 */
export function validateEffectiveKind(
  oldSale: EffectiveKindDbRow,
  data: EffectiveKindPatch,
): string[] {
  const oldCosts = oldSale.additional_costs;
  return validateSaleKind({
    kind: (oldSale.sale_kind === "servico" ? "servico" : "milhas") as "milhas" | "servico",
    milesUsed: Number(data.milesUsed ?? oldSale.miles_used ?? 0),
    accountId: (data.accountId ?? oldSale.account_id ?? null) as string | null,
    saleValue: Number(data.saleValue ?? oldSale.sale_value ?? 0),
    clientId: (data.clientId ?? oldSale.client_id ?? null) as string | null,
    serviceType: (data.serviceType ?? oldSale.service_type ?? null) as ServiceType | null,
    pricePerMile: (data.pricePerMile ?? oldSale.price_per_mile ?? null) as number | null,
    observations: (data.observations ?? oldSale.observations ?? null) as string | null,
    additionalCosts: (data.additionalCosts ?? (Array.isArray(oldCosts) ? oldCosts : null)) as
      { desc: string; amount: number }[] | null,
  });
}

/** Rótulo pt-BR do tipo de serviço (ponto único p/ listagens e CSV). */
export function serviceTypeLabel(t?: string | null): string {
  if (t === "consultoria") return "Consultoria";
  if (t === "taxa") return "Taxa de embarque";
  if (t === "outro") return "Outro";
  return "Serviço";
}

export function validateSaleKind(input: SaleKindInput): string[] {
  const errs: string[] = [];
  if (input.kind === "servico") {
    if (Number(input.milesUsed) !== 0) errs.push("Venda de serviço não usa milhas.");
    if (input.accountId) errs.push("Venda de serviço não vincula conta.");
    if (!(Number(input.saleValue) > 0)) errs.push("Informe o valor do serviço.");
    if (!input.clientId) errs.push("Informe o cliente.");
    if (!input.serviceType) errs.push("Informe o tipo de serviço.");
    if (input.pricePerMile != null) errs.push("Venda de serviço não tem valor por milha.");
    if (Array.isArray(input.additionalCosts) && input.additionalCosts.length > 0)
      errs.push("Venda de serviço não tem custos adicionais.");
  } else {
    if (!(Number(input.milesUsed) > 0)) errs.push("Informe as milhas utilizadas.");
    if (input.serviceType) errs.push("Tipo de serviço é só para venda-serviço.");
    if (input.observations?.trim()) errs.push("Observações são só para venda-serviço.");
  }
  return errs;
}
