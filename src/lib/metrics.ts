/**
 * Módulo único de regras de negócio financeiras.
 * Funções PURAS — sem React, sem Supabase, sem efeitos colaterais.
 * Toda fórmula financeira do sistema deve estar aqui.
 */

// ─── Cálculos de Custo ───

/** Custo por milha: total pago ÷ milhas geradas */
export function calcCostPerMile(amountPaid: number, milesGenerated: number): number {
  return milesGenerated > 0 ? amountPaid / milesGenerated : 0;
}

/** Custo por milheiro: (total pago / quantidade) × 1000 */
export function calcCostPerThousand(amountPaid: number, amount: number): number {
  return amount > 0 ? (amountPaid / amount) * 1000 : 0;
}

/** Custo médio ponderado: (totalInvestido / totalMilhas) */
export function calcAverageCostPerMile(totalInvested: number, totalMiles: number): number {
  return totalMiles > 0 ? totalInvested / totalMiles : 0;
}

// ─── Cálculos de Venda ───

/** Lucro bruto: valorVenda - (milhasUsadas × custoPorMilha) - custosAdicionais */
export function calcProfit(
  saleValue: number,
  milesUsed: number,
  costPerMile: number,
  additionalCost = 0,
): number {
  return saleValue - milesUsed * costPerMile - additionalCost;
}

/** Margem de lucro percentual: (lucro / valorVenda) × 100 */
export function calcProfitMargin(profit: number, saleValue: number): number {
  return saleValue > 0 ? (profit / saleValue) * 100 : 0;
}

// ─── Cálculos de Investimento ───

/** ROI: (lucro / totalInvestido) × 100 */
export function calcROI(profit: number, totalInvested: number): number {
  return totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
}

// ─── Cálculos de Entrada/Transferência ───

/** Milhas geradas (com ou sem bônus de transferência) */
export function calcMilesGenerated(
  amount: number,
  conversionRate: number,
  bonusPercent?: number,
): number {
  if (bonusPercent && bonusPercent > 0) {
    return amount * (1 + bonusPercent / 100);
  }
  return amount * conversionRate;
}

/** Custo proporcional para remover de conta origem em transferência */
export function calcProportionalCost(
  amountToRemove: number,
  sourceBalance: number,
  sourceTotalInvested: number,
): number {
  if (sourceBalance <= 0 || amountToRemove <= 0) return 0;
  return (sourceTotalInvested / sourceBalance) * amountToRemove;
}

// ─── Cálculos de Relatório ───

/** Custo médio ponderado por saldo (usado em relatórios por programa) */
export function calcWeightedAverageCost(
  accounts: { balance: number; averageCostPerMile?: number }[],
): number {
  const totalStock = accounts.reduce((sum, a) => sum + a.balance, 0);
  if (totalStock <= 0) return 0;
  const weightedCost = accounts.reduce(
    (sum, a) => sum + (a.averageCostPerMile ?? 0) * a.balance,
    0,
  );
  return weightedCost / totalStock;
}

/** Variação percentual de receita entre dois períodos */
export function calcRevenueChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

// ─── Métricas Agregadas (Dashboard / Relatórios) ───

export interface DashboardMetrics {
  totalMiles: number
  totalInvested: number
  monthlyRevenue: number
  monthlyProfit: number
  activeAccounts: number
  pendingSales: number
  cpfAlerts: number
  totalSoldMiles: number
  totalRevenue: number
  totalProfit: number
  avgProfitMargin: number
  avgCostPerMile: number
  monthlyMilesIn: number
  revenueChange: number
}

interface MetricAccount {
  id: string
  balance: number
  totalInvested?: number
  status: string
  ownerId: string
}

interface MetricSale {
  status: string
  date: string
  saleValue: number
  profit: number
  milesUsed: number
  accountId?: string | null
  passengers: { cpf: string }[]
}

interface MetricEntry {
  date: string
  amount: number
  entryStatus?: string
}

interface MetricOwner {
  id: string
  name: string
}

/** Filtra vendas não-canceladas */
export function filterActiveSales<T extends { status: string }>(sales: T[]): T[] {
  return sales.filter(s => s.status !== "cancelado");
}

/** Filtra vendas de um mês específico */
export function filterSalesByMonth<T extends { date: string }>(
  sales: T[],
  month: number,
  year: number,
): T[] {
  return sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

/** Calcula todas as métricas do Dashboard (função pura, sem React) */
export function computeDashboardMetrics(
  accts: MetricAccount[],
  sls: MetricSale[],
  entrs: MetricEntry[],
  owners: MetricOwner[],
  maxCpfPerOwner = 22,
): DashboardMetrics {
  const confirmedEntries = entrs.filter(e => e.entryStatus !== 'aguardando');
  const activeSales = filterActiveSales(sls);
  const totalMiles = accts.reduce((sum, a) => sum + a.balance, 0);
  const totalInvested = accts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
  const activeAccounts = accts.filter(a => a.status === "ativa").length;
  const pendingSales = activeSales.filter(s => s.status === "pendente").length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySales = filterSalesByMonth(activeSales, currentMonth, currentYear);
  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.saleValue, 0);
  const monthlyProfit = monthlySales.reduce((sum, s) => sum + s.profit, 0);

  const totalSoldMiles = activeSales.reduce((sum, s) => sum + s.milesUsed, 0);
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
  const avgProfitMargin = calcProfitMargin(totalProfit, totalRevenue);
  const avgCostPerMile = calcAverageCostPerMile(totalInvested, totalMiles);

  const monthlyEntries = confirmedEntries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyMilesIn = monthlyEntries.reduce((sum, e) => sum + e.amount, 0);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthSales = filterSalesByMonth(activeSales, lastMonth.getMonth(), lastMonth.getFullYear());
  const prevRevenue = prevMonthSales.reduce((sum, s) => sum + s.saleValue, 0);
  const revenueChange = calcRevenueChange(monthlyRevenue, prevRevenue);

  const cpfAlerts = owners.filter(o => {
    const ownerAccountIds = accts.filter(a => a.ownerId === o.id).map(a => a.id);
    const ownerSales = activeSales.filter(s => ownerAccountIds.includes(s.accountId ?? ""));
    const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
    return usedCpfs.size >= maxCpfPerOwner - 4;
  }).length;

  return {
    totalMiles, totalInvested, monthlyRevenue, monthlyProfit,
    activeAccounts, pendingSales, cpfAlerts,
    totalSoldMiles, totalRevenue, totalProfit,
    avgProfitMargin, avgCostPerMile, monthlyMilesIn, revenueChange,
  };
}
