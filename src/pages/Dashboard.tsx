import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { TrendingDown, TrendingUp, Users } from "lucide-react";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FlowMap } from "@/components/FlowMap";
import { DashboardAlertBanners } from "@/components/dashboard/DashboardAlertBanners";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { DashboardSecondaryMetrics } from "@/components/dashboard/DashboardSecondaryMetrics";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { FinancialMetricCards } from "@/components/dashboard/FinancialMetricCards";
import { OwnerStockList } from "@/components/dashboard/OwnerStockList";
import { RecentSalesList } from "@/components/dashboard/RecentSalesList";
import { RecentTransfersList } from "@/components/dashboard/RecentTransfersList";
import { StockCards } from "@/components/dashboard/StockCards";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // bug #544: vendas vinculadas a contas de pontos precisam entrar no saldo
  // calculado — o recalcAccount subtrai vendas de qualquer conta, então o
  // dashboard precisa da mesma regra ou o banner acusa discrepância permanente.
  const pontosSales = useMemo(
    () => salesOfAccountType(sales, accounts, "pontos"),
    [sales, accounts],
  );

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
    return <DashboardSkeleton />;
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

        <DashboardAlertBanners
          overdueCount={overdueEntries.length}
          pendingCount={activePendingEntries.length}
          activeTab={activeTab}
          onViewEntries={() => navigate("/entradas")}
        />

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
          <DashboardSecondaryMetrics
            metrics={currentMetrics}
            metricHistory={metricHistory}
            variant="milhas"
          />

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
          <DashboardSecondaryMetrics metrics={currentMetrics} variant="pontos" />

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
