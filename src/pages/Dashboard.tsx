import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CreditCard, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FlowMap } from "@/components/FlowMap";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { FinancialMetricCards } from "@/components/dashboard/FinancialMetricCards";
import { OwnerStockList } from "@/components/dashboard/OwnerStockList";
import { RecentSalesList } from "@/components/dashboard/RecentSalesList";
import { RecentTransfersList } from "@/components/dashboard/RecentTransfersList";
import { StockCards } from "@/components/dashboard/StockCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";
import { useData } from "@/contexts/DataContext";
import { computeDashboardMetrics, computeMetricHistory } from "@/lib/metrics";
import {
  MAX_CPF_PER_OWNER,
  accountsByOwner,
  accountsOfType,
  computeOwnerData,
  computeProgramData,
  entriesByOwner,
  entriesOfAccountType,
  salesByOwner,
  salesOfAccountType,
} from "@/lib/dashboardSelectors";
import {
  computeMonthlySales,
  computeRecentEntries,
  computeRecentSales,
  computeRecentTransfers,
} from "@/lib/dashboardTimeline";

export default function Dashboard() {
  const navigate = useNavigate();
  const { owners, accounts, programs, sales, entries, origemTypes, isLoading } = useData();
  const [activeTab, setActiveTab] = useState<"milhas" | "pontos">("milhas");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const pendingEntries = useMemo(
    () => entries.filter((e) => e.entryStatus === "aguardando"),
    [entries],
  );
  const overdueEntries = useMemo(
    () => pendingEntries.filter((e) => e.date < today),
    [pendingEntries, today],
  );
  const activePendingEntries = useMemo(
    () => pendingEntries.filter((e) => e.date >= today),
    [pendingEntries, today],
  );

  const milhasAccounts = useMemo(() => accountsOfType(accounts, "milhas"), [accounts]);
  const pontosAccounts = useMemo(() => accountsOfType(accounts, "pontos"), [accounts]);
  const filteredPontosAccounts = useMemo(
    () => accountsByOwner(pontosAccounts, selectedOwner),
    [pontosAccounts, selectedOwner],
  );
  const totalPontosBalance = useMemo(
    () => filteredPontosAccounts.reduce((sum, a) => sum + a.balance, 0),
    [filteredPontosAccounts],
  );
  const totalPontosInvested = useMemo(
    () => filteredPontosAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0),
    [filteredPontosAccounts],
  );

  const milhasSales = useMemo(
    () => salesOfAccountType(sales, accounts, "milhas"),
    [sales, accounts],
  );

  // ponytail: pontos sales not implemented yet — no sales tracking for points accounts
  const pontosSales = useMemo(() => [], []);

  const milhasEntries = useMemo(
    () => entriesOfAccountType(entries, accounts, "milhas"),
    [entries, accounts],
  );
  const pontosEntries = useMemo(
    () => entriesOfAccountType(entries, accounts, "pontos"),
    [entries, accounts],
  );

  const currentAccounts = activeTab === "milhas" ? milhasAccounts : pontosAccounts;
  const currentSales = activeTab === "milhas" ? milhasSales : pontosSales;
  const currentEntries = activeTab === "milhas" ? milhasEntries : pontosEntries;

  const filteredAccounts = useMemo(
    () => accountsByOwner(currentAccounts, selectedOwner),
    [currentAccounts, selectedOwner],
  );
  const filteredSales = useMemo(
    () => salesByOwner(currentSales, accounts, selectedOwner),
    [currentSales, selectedOwner, accounts],
  );
  const filteredEntries = useMemo(
    () => entriesByOwner(currentEntries, accounts, selectedOwner),
    [currentEntries, selectedOwner, accounts],
  );

  const currentMetrics = useMemo(
    () =>
      computeDashboardMetrics(
        filteredAccounts,
        filteredSales,
        filteredEntries,
        owners,
        MAX_CPF_PER_OWNER,
      ),
    [filteredAccounts, filteredSales, filteredEntries, owners],
  );

  const filteredMilhasAccounts = useMemo(
    () => accountsByOwner(milhasAccounts, selectedOwner),
    [milhasAccounts, selectedOwner],
  );
  const filteredMilhasSales = useMemo(
    () => salesByOwner(milhasSales, accounts, selectedOwner),
    [milhasSales, selectedOwner, accounts],
  );
  const filteredMilhasEntries = useMemo(
    () => entriesByOwner(milhasEntries, accounts, selectedOwner),
    [milhasEntries, selectedOwner, accounts],
  );

  const financialMetrics = useMemo(
    () =>
      computeDashboardMetrics(
        filteredMilhasAccounts,
        filteredMilhasSales,
        filteredMilhasEntries,
        owners,
        MAX_CPF_PER_OWNER,
      ),
    [filteredMilhasAccounts, filteredMilhasSales, filteredMilhasEntries, owners],
  );

  const metricHistory = useMemo(
    () => computeMetricHistory(filteredSales, filteredEntries, 6),
    [filteredSales, filteredEntries],
  );

  const financialHistory = useMemo(
    () => computeMetricHistory(filteredMilhasSales, filteredMilhasEntries, 6),
    [filteredMilhasSales, filteredMilhasEntries],
  );

  const ownerData = useMemo(
    () => computeOwnerData(owners, filteredAccounts, programs, filteredSales, MAX_CPF_PER_OWNER),
    [owners, filteredAccounts, programs, filteredSales],
  );

  const recentSales = useMemo(() => computeRecentSales(filteredSales), [filteredSales]);

  const programData = useMemo(
    () => computeProgramData(filteredAccounts, programs),
    [filteredAccounts, programs],
  );

  const monthlySales = useMemo(() => computeMonthlySales(filteredSales), [filteredSales]);

  const recentEntries = useMemo(
    () => computeRecentEntries(filteredEntries, accounts),
    [filteredEntries, accounts],
  );

  const recentTransfers = useMemo(
    () => computeRecentTransfers(filteredEntries, accounts, origemTypes),
    [filteredEntries, accounts, origemTypes],
  );

  // ── Loading state (after all hooks) ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-12 w-72 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted rounded-xl animate-pulse" />
              <div className="h-16 bg-muted rounded-xl animate-pulse" />
              <div className="h-16 bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-6 space-y-4">
            <SkeletonTable rows={4} cols={3} />
          </div>
          <div className="rounded-xl border border-border p-6 space-y-4">
            <SkeletonTable rows={4} cols={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "milhas" | "pontos")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="milhas" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Milhas
            </TabsTrigger>
            <TabsTrigger value="pontos" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Pontos
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-1">
            <Button
              key="all"
              variant={selectedOwner === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOwner(null)}
            >
              Todos
            </Button>
            {owners.map((o) => (
              <Button
                key={o.id}
                variant={selectedOwner === o.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedOwner(o.id)}
              >
                {o.name.split(" ")[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Entradas atrasadas */}
        {overdueEntries.length > 0 && (
          <div
            className="rounded-lg border border-red-400/30 bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 flex items-start gap-3 animate-appear"
            onClick={() => navigate("/entradas")}
          >
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {overdueEntries.length} entrada{overdueEntries.length > 1 ? "s" : ""} atrasada
                {overdueEntries.length > 1 ? "s" : ""} — confirmação vencida
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                Clube de {activeTab === "milhas" ? "Milhas" : "Pontos"} — regularize em Entradas
                para atualizar o saldo
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              asChild
            >
              <a href="/entradas">Ver →</a>
            </Button>
          </div>
        )}

        {/* Entradas pendentes no prazo */}
        {activePendingEntries.length > 0 && (
          <div
            className="rounded-lg border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 flex items-start gap-3 animate-appear"
            onClick={() => navigate("/entradas")}
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {activePendingEntries.length} entrada{activePendingEntries.length > 1 ? "s" : ""}{" "}
                pendente
                {activePendingEntries.length > 1 ? "s" : ""} de confirmação
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Clube de {activeTab === "milhas" ? "Milhas" : "Pontos"} — confirme em Entradas para
                atualizar o saldo
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              asChild
            >
              <a href="/entradas">Ver →</a>
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MILHAS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="milhas" className="space-y-6 mt-6">
          {/* HERO — ALTÍMETRO */}
          <DashboardHero
            variant="milhas"
            currentMetrics={currentMetrics}
            financialMetrics={financialMetrics}
            owners={owners}
            selectedOwner={selectedOwner}
            reconcileAccounts={selectedOwner ? filteredAccounts : milhasAccounts}
            goal={500000}
          />

          {/* METRIC CARDS */}
          <FinancialMetricCards
            financialMetrics={financialMetrics}
            financialHistory={financialHistory}
          />

          {/* ESTOQUE + FLUXO DE TRABALHO */}
          <div className="animate-appear animate-delay-400 space-y-4">
            <StockCards
              milhas={{
                label: "Milhas em Estoque",
                value: `${currentMetrics.totalMiles.toLocaleString("pt-BR")} milhas`,
                iconClass: "bg-primary/10 text-primary",
                accentClass: "from-primary/60 via-gold/40 to-primary/30",
                rows: [
                  {
                    label: "Saldo total",
                    value: currentMetrics.totalMiles.toLocaleString("pt-BR"),
                    rowClass: "bg-primary/5 border border-primary/10",
                    valueClass: "text-primary",
                  },
                  {
                    label: "Total investido",
                    value: `R$ ${financialMetrics.totalInvested.toLocaleString("pt-BR")}`,
                    rowClass: "bg-gold/5 border border-gold/10",
                    valueClass: "text-gold",
                  },
                ],
              }}
              pontos={{
                label: "Pontos em Estoque",
                value: `${totalPontosBalance.toLocaleString("pt-BR")} pontos`,
                iconClass: "bg-teal/10 text-teal",
                accentClass: "from-teal/60 via-gold/40 to-teal/30",
                rows: [
                  {
                    label: "Saldo total",
                    value: totalPontosBalance.toLocaleString("pt-BR"),
                    rowClass: "bg-teal/5 border border-teal/10",
                    valueClass: "text-teal",
                  },
                  {
                    label: "Total investido",
                    value: `R$ ${totalPontosInvested.toLocaleString("pt-BR")}`,
                    rowClass: "bg-gold/5 border border-gold/10",
                    valueClass: "text-gold",
                  },
                ],
              }}
            />

            <FlowMap
              title="Fluxo de Trabalho"
              totalMiles={currentMetrics.totalMiles}
              activeAccounts={currentMetrics.activeAccounts}
              totalSoldMiles={currentMetrics.totalSoldMiles}
              totalRevenue={financialMetrics.totalRevenue}
              ownersCount={selectedOwner ? 1 : owners.length}
              unitLabel="Milhas"
            />
          </div>

          {/* CHARTS */}
          <div className="animate-appear animate-delay-600">
            <DashboardCharts
              programData={programData}
              monthlySales={monthlySales}
              unitLabel="Milhas"
            />
          </div>

          {/* SECONDARY METRICS */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-800">
            <MetricCard
              title="Contas Ativas"
              value={currentMetrics.activeAccounts}
              subtitle="Contas operacionais"
              icon={CreditCard}
              variant="teal"
              sparklineData={metricHistory.milesIn}
            />
            <MetricCard
              title="Vendas Pendentes"
              value={currentMetrics.pendingSales}
              subtitle="Aguardando processamento"
              icon={Target}
              variant="default"
            />
            <MetricCard
              title="Alertas CPF"
              value={currentMetrics.cpfAlerts}
              subtitle="Próximo ao limite"
              icon={AlertTriangle}
              variant="warning"
            />
          </div>

          {/* OWNER + SALES */}
          <div
            className={`grid gap-4 ${selectedOwner ? "md:grid-cols-1" : "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2"} animate-appear animate-delay-1000`}
          >
            {!selectedOwner && (
              <OwnerStockList
                ownerData={ownerData}
                unitLabel="milhas"
                showCpfBadge
                emptyTitle="Nenhum dono com estoque"
                emptyDescription="Crie uma conta e registre entradas — em poucos minutos você vê o estoque crescer."
                icon={Users}
                title="Estoque por Dono"
              />
            )}

            <RecentSalesList recentSales={recentSales} />
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* PONTOS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="pontos" className="space-y-6 mt-6">
          {/* HERO — INVESTIMENTO EM PONTOS */}
          <DashboardHero
            variant="pontos"
            currentMetrics={currentMetrics}
            owners={owners}
            selectedOwner={selectedOwner}
            reconcileAccounts={selectedOwner ? filteredAccounts : pontosAccounts}
            goal={300000}
          />

          {/* CHARTS — só pizza */}
          <div className="animate-appear animate-delay-600">
            <DashboardCharts
              programData={programData}
              monthlySales={monthlySales}
              unitLabel="Pontos"
              hideBarChart
            />
          </div>

          {/* SECONDARY METRICS */}
          <div className="animate-appear animate-delay-800">
            <MetricCard
              title="Contas Ativas (Pontos)"
              value={currentMetrics.activeAccounts}
              subtitle="Contas de pontos operacionais"
              icon={CreditCard}
              variant="teal"
            />
          </div>

          {/* OWNER + TRANSFERS */}
          <div
            className={`grid gap-4 ${selectedOwner ? "md:grid-cols-1" : "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2"} animate-appear animate-delay-1000`}
          >
            {!selectedOwner && (
              <OwnerStockList
                ownerData={ownerData}
                unitLabel="pontos"
                emptyTitle="Nenhum dono com pontos"
                emptyDescription="Crie uma conta de pontos e registre transferências para acompanhar seus investimentos."
                icon={Users}
                title="Estoque por Dono (Pontos)"
              />
            )}

            <RecentTransfersList recentTransfers={recentTransfers} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
