import { getOwnerAccountIds } from "@/lib/dashboardSelectors";
import { formatDateBR } from "@/lib/dateUtils";
import { ALL_OWNERS, ALL_PROGRAMS } from "@/components/ui";
import type { Sale, Account, Program } from "@/types";

export function filterSales(
  sales: Sale[],
  statusFilter: string,
  ownerFilter: string,
  programFilter: string,
  debouncedSearch: string,
  accounts: Account[],
  programs: Program[],
): Sale[] {
  const ownerAccountIds =
    ownerFilter === ALL_OWNERS ? null : getOwnerAccountIds(accounts, ownerFilter);
  const selectedProgramName =
    programFilter === ALL_PROGRAMS
      ? null
      : (programs.find((p) => p.id === programFilter)?.name ?? null);
  const selectedProgramKey = selectedProgramName?.trim().toLowerCase() ?? null;

  return sales.filter((s) => {
    if (statusFilter !== "todos" && s.status !== statusFilter) return false;
    if (ownerAccountIds && !ownerAccountIds.has(s.accountId ?? "")) return false;
    if (selectedProgramKey && (s.program ?? "").trim().toLowerCase() !== selectedProgramKey)
      return false;
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      s.clientName.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q) ||
      s.program.toLowerCase().includes(q) ||
      s.ticketLocator.toLowerCase().includes(q)
    );
  });
}

export function buildExportRows(sales: Sale[]): Record<string, string | number>[] {
  return sales.map((s) => ({
    Data: formatDateBR(s.date),
    Cliente: s.clientName,
    Dono: s.ownerName,
    Programa: s.program,
    Milhas: s.milesUsed,
    "Valor Venda (R$)": s.saleValue,
    "Recebido (R$)": s.amountReceived ?? 0,
    "Pendente (R$)": Math.max(0, s.saleValue - (s.amountReceived ?? 0)),
    "Custo/Milha (R$)": s.costPerMile?.toFixed(4) ?? "",
    Tipo: s.kind === "servico" ? "Serviço" : "Milhas",
    "Tipo Serviço": s.kind === "servico" ? (s.serviceType ?? "") : "",
    Observações: s.observations ?? "",
    "Lucro (R$)": s.profit?.toFixed(2) ?? "",
    Margem: s.profitMargin ? `${s.profitMargin.toFixed(1)}%` : "",
    Status: s.status,
  }));
}
