/** Séries de negócio diárias (Datadog interno). Funções PURAS — regra-31: tests/unit/businessSeries.test.ts */

export interface DailyBusinessPoint {
  day: string;
  label: string;
  revenue: number;
  profit: number;
  milesIn: number;
  milesOut: number;
}

interface SeriesSale {
  date: string;
  status?: string;
  saleValue?: number;
  profit?: number;
  milesUsed?: number;
}

interface SeriesEntry {
  date: string;
  amount: number;
  milesGenerated?: number;
  sourceAccountId?: string;
  entryStatus?: string;
}

export interface OwnerBreakdown {
  name: string;
  totalMiles: number;
  totalInvested: number;
  cpfCount: number;
}

export interface ProgramBreakdown {
  name: string;
  balance: number;
}

interface BreakdownOwner {
  id: string;
  name: string;
}

interface BreakdownAccount {
  id: string;
  ownerId: string;
  programId: string;
  balance: number;
  totalInvested?: number;
}

interface BreakdownProgram {
  id: string;
  name: string;
}

interface BreakdownSale {
  accountId?: string | null;
  status?: string;
  passengers?: Array<{ cpf?: string }>;
}

/**
 * "2026-08-13" → "13/08" (client). Espelho de formatDayLabel em
 * scripts/data-refresh.mjs — mantenha em sincronia.
 */
export function businessDayLabel(day: string): string {
  const [, m, d] = day.split("-");
  return d && m ? `${d}/${m}` : day;
}

export function computeOwnersBreakdown(
  owners: BreakdownOwner[],
  accounts: BreakdownAccount[],
  sales: BreakdownSale[],
): OwnerBreakdown[] {
  return owners
    .map((owner) => {
      const ownerAccounts = accounts.filter((a) => a.ownerId === owner.id);
      const ownerAccountIds = new Set(ownerAccounts.map((a) => a.id));
      const ownerSales = sales.filter(
        (s) => s.status !== "cancelado" && s.accountId != null && ownerAccountIds.has(s.accountId),
      );
      return {
        name: owner.name,
        totalMiles: ownerAccounts.reduce((sum, a) => sum + a.balance, 0),
        totalInvested: ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0),
        cpfCount: new Set(
          ownerSales.flatMap((s) => (s.passengers ?? []).map((p) => p.cpf ?? "").filter(Boolean)),
        ).size,
      };
    })
    .filter((o) => o.totalMiles > 0 || o.totalInvested > 0)
    .sort((a, b) => b.totalMiles - a.totalMiles);
}

/** Saldo por programa. */
export function computeProgramsBreakdown(
  programs: BreakdownProgram[],
  accounts: BreakdownAccount[],
): ProgramBreakdown[] {
  const byProgram = new Map<string, number>();
  for (const a of accounts) {
    byProgram.set(a.programId, (byProgram.get(a.programId) ?? 0) + a.balance);
  }
  return programs
    .map((p) => ({ name: p.name, balance: byProgram.get(p.id) ?? 0 }))
    .filter((p) => p.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}

/**
 * Série diária de negócio dos últimos N dias (mais antigo → mais recente).
 * Exclui vendas canceladas, entradas não confirmadas e transferências
 * (não criam milhas novas) — mesmas regras do computeDashboardMetrics.
 */
export function computeDailyBusinessSeries(
  sales: SeriesSale[],
  entries: SeriesEntry[],
  days = 14,
): DailyBusinessPoint[] {
  const out: DailyBusinessPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;

    const daySales = sales.filter(
      (s) => s.status !== "cancelado" && (s.date ?? "").startsWith(day),
    );
    const dayEntries = entries.filter(
      (e) => e.entryStatus !== "aguardando" && (e.date ?? "").startsWith(day),
    );

    const revenue = daySales.reduce((sum, s) => sum + (s.saleValue ?? 0), 0);
    const profit = daySales.reduce((sum, s) => sum + (s.profit ?? 0), 0);
    const milesIn = dayEntries
      .filter((e) => !e.sourceAccountId)
      .reduce((sum, e) => sum + (e.milesGenerated ?? e.amount), 0);
    const milesOut = daySales.reduce((sum, s) => sum + (s.milesUsed ?? 0), 0);

    out.push({ day, label: businessDayLabel(day), revenue, profit, milesIn, milesOut });
  }

  return out;
}
