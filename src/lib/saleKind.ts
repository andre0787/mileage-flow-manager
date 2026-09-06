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
