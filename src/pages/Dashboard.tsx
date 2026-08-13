import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Target,
  AlertTriangle,
  DollarSign,
  Plane,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { AltitudeBar } from "@/components/AltitudeBar";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FlowMap } from "@/components/FlowMap";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BalanceReconcileBanner } from "@/components/BalanceReconcileBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";
import { useData } from "@/contexts/DataContext";
import { formatDateBR } from "@/lib/dateUtils";
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
  const unitLabel = activeTab === "milhas" ? "Milhas" : "Pontos";

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
          <section className="relative overflow-hidden rounded-2xl border border-primary/15 shadow-elegant animate-appear">
            <div className="absolute inset-0 bg-gradient-hero bg-[length:200%_200%] animate-gradient-shift" />
            <div className="absolute inset-0 hero-glow" />
            <div className="absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
            <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full bg-primary/30 top-[15%] left-[10%] animate-drift" />
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-gold/40 top-[25%] right-[20%] animate-drift-slow"
                style={{ animationDelay: "-2s" }}
              />
              <div
                className="absolute w-1 h-1 rounded-full bg-teal/30 top-[60%] left-[30%] animate-drift"
                style={{ animationDelay: "-3s" }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-primary/20 bottom-[20%] right-[15%] animate-drift-slow"
                style={{ animationDelay: "-1s" }}
              />
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-gold/25 top-[70%] right-[40%] animate-drift"
                style={{ animationDelay: "-4s" }}
              />
              <div
                className="absolute w-1 h-1 rounded-full bg-white/20 top-[40%] left-[60%] animate-drift-slow"
                style={{ animationDelay: "-5s" }}
              />
            </div>
            <div className="hidden sm:block absolute top-0 right-1/4 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl" />
            <div className="hidden sm:block absolute bottom-0 left-1/3 w-96 h-96 bg-gold/[0.05] rounded-full blur-3xl" />
            <div className="hidden sm:block absolute right-6 bottom-4 text-foreground/[0.025] pointer-events-none select-none">
              <Plane className="w-32 h-32 md:w-48 md:h-48" />
            </div>

            <div className="relative p-4 md:p-8">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                  <span className="relative rounded-full bg-success h-2 w-2" />
                </span>
                <span className="text-xs tracking-wide text-muted-foreground font-medium">
                  {selectedOwner
                    ? (owners.find((o) => o.id === selectedOwner)?.name ?? "Sistema")
                    : "Sistema Operacional"}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>

              <AltitudeBar value={currentMetrics.totalMiles} goal={500000} className="mb-5" />

              <BalanceReconcileBanner
                computedTotal={currentMetrics.totalMiles}
                accounts={selectedOwner ? filteredAccounts : milhasAccounts}
              />

              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-foreground tracking-tight leading-none tabular-nums">
                      <AnimatedNumber value={currentMetrics.totalMiles} />
                    </h1>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide font-display">
                      milhas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <ArrowUpRight className="w-3 h-3 text-success shrink-0" />
                        <span className="truncate">Entradas no mês</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-success tabular-nums">
                        +<AnimatedNumber value={currentMetrics.monthlyMilesIn} />
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <ArrowDownRight className="w-3 h-3 text-gold shrink-0" />
                        <span className="truncate">Milhas vendidas</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gold tabular-nums">
                        <AnimatedNumber value={currentMetrics.totalSoldMiles} />
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-teal shrink-0" />
                        <span className="truncate">Custo médio/milha</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-teal tabular-nums">
                        R$ {currentMetrics.avgCostPerMile.toFixed(3)}
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">Contas ativas</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                        {currentMetrics.activeAccounts}
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-primary/20 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <Target className="w-3 h-3 text-success shrink-0" />
                        <span className="truncate">Margem Média</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-success tabular-nums">
                        {financialMetrics.avgProfitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-gold/20 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-gold shrink-0" />
                        <span className="truncate">Receita Total</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gold tabular-nums">
                        R$ <AnimatedNumber value={financialMetrics.totalRevenue} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-1 bg-gradient-to-r from-primary/25 via-primary/10 to-teal/25" />
          </section>

          {/* METRIC CARDS */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
            <MetricCard
              title="Total Investido"
              value={financialMetrics.totalInvested}
              subtitle="Capital aplicado"
              icon={Wallet}
              variant="gold"
              prefix="R$"
              trend={{
                value: Math.round(financialMetrics.revenueChange),
                isPositive: financialMetrics.revenueChange >= 0,
              }}
              sparklineData={financialHistory.revenue}
            />
            <MetricCard
              title="Faturamento Mensal"
              value={financialMetrics.monthlyRevenue}
              subtitle="Receita do mês"
              icon={DollarSign}
              variant="success"
              prefix="R$"
              sparklineData={financialHistory.revenue}
            />
            <MetricCard
              title="Lucro Mensal"
              value={financialMetrics.monthlyProfit}
              subtitle="Ganho líquido"
              icon={TrendingUp}
              variant="teal"
              prefix="R$"
              sparklineData={financialHistory.profit}
            />
            <MetricCard
              title="Margem de Lucro"
              value={`${financialMetrics.avgProfitMargin.toFixed(1)}%`}
              subtitle="Sobre receita total"
              icon={Target}
              variant="default"
              sparklineData={financialHistory.profit}
            />
          </div>

          {/* ESTOQUE + FLUXO DE TRABALHO */}
          <div className="animate-appear animate-delay-400 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Milhas em Estoque */}
              <Card className="overflow-hidden transition-card duration-300 hover:shadow-elegant">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-gold/40 to-primary/30" />
                <CardContent className="p-5 md:p-6 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground font-display">
                        Milhas em Estoque
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {currentMetrics.totalMiles.toLocaleString("pt-BR")} milhas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-xs text-muted-foreground">Saldo total</span>
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {currentMetrics.totalMiles.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gold/5 border border-gold/10">
                      <span className="text-xs text-muted-foreground">Total investido</span>
                      <span className="text-sm font-bold text-gold tabular-nums">
                        R$ {financialMetrics.totalInvested.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pontos em Estoque */}
              <Card className="overflow-hidden transition-card duration-300 hover:shadow-elegant">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal/60 via-gold/40 to-teal/30" />
                <CardContent className="p-5 md:p-6 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-teal" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground font-display">
                        Pontos em Estoque
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {totalPontosBalance.toLocaleString("pt-BR")} pontos
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal/5 border border-teal/10">
                      <span className="text-xs text-muted-foreground">Saldo total</span>
                      <span className="text-sm font-bold text-teal tabular-nums">
                        {totalPontosBalance.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-gold/5 border border-gold/10">
                      <span className="text-xs text-muted-foreground">Total investido</span>
                      <span className="text-sm font-bold text-gold tabular-nums">
                        R$ {totalPontosInvested.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
                    <Users className="h-4 w-4 text-primary" />
                    Estoque por Dono
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {ownerData.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Nenhum dono com estoque"
                        description="Crie uma conta e registre entradas — em poucos minutos você vê o estoque crescer."
                      />
                    ) : (
                      ownerData.map((owner) => (
                        <div
                          key={owner.owner}
                          className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
                        >
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-foreground font-display">
                              {owner.owner}
                            </h3>
                            <p className="text-xs text-muted-foreground font-body">
                              {owner.programs.join(", ")} •{" "}
                              <span className="font-semibold">
                                {owner.totalMiles.toLocaleString("pt-BR")} milhas
                              </span>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              R$ {owner.totalInvested.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              R$ {owner.avgCost.toFixed(4)}/milha
                            </p>
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-xs text-muted-foreground">
                                CPFs: {owner.cpfCount}/{owner.maxCpf}
                              </span>
                              <Badge
                                variant={
                                  owner.cpfCount >= 20
                                    ? "destructive"
                                    : owner.cpfCount >= 18
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs px-1.5 py-0"
                              >
                                {owner.cpfCount >= 20
                                  ? "Crítico"
                                  : owner.cpfCount >= 18
                                    ? "Atenção"
                                    : "OK"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Vendas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentSales.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="Nenhuma venda registrada"
                      description="Vender milhas é o próximo passo natural. Crie sua primeira venda na aba Vendas."
                    />
                  ) : (
                    recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground font-display truncate">
                            {sale.client}
                          </h4>
                          <p className="text-xs text-muted-foreground font-body truncate">
                            {sale.owner} • {sale.program} •{" "}
                            <span className="font-semibold tabular-nums">
                              {sale.miles.toLocaleString("pt-BR")} milhas
                            </span>
                          </p>
                        </div>
                        <div className="text-right space-y-0.5 shrink-0 ml-3">
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            R$ {sale.value.toLocaleString("pt-BR")}
                          </p>
                          <Badge variant={sale.statusColor} className="text-xs px-1.5 py-0">
                            {sale.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* PONTOS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="pontos" className="space-y-6 mt-6">
          {/* HERO — INVESTIMENTO EM PONTOS */}
          <section className="relative overflow-hidden rounded-2xl border border-teal/20 shadow-elegant animate-appear">
            <div className="absolute inset-0 bg-gradient-hero-teal bg-[length:200%_200%] animate-gradient-shift" />
            <div className="absolute inset-0 hero-glow" />
            <div className="absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
            <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full bg-teal/40 top-[15%] left-[10%] animate-drift" />
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-gold/30 top-[25%] right-[20%] animate-drift-slow"
                style={{ animationDelay: "-2s" }}
              />
              <div
                className="absolute w-1 h-1 rounded-full bg-teal/40 top-[60%] left-[30%] animate-drift"
                style={{ animationDelay: "-3s" }}
              />
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-teal/30 bottom-[20%] right-[15%] animate-drift-slow"
                style={{ animationDelay: "-1s" }}
              />
              <div
                className="absolute w-1.5 h-1.5 rounded-full bg-gold/20 top-[70%] right-[40%] animate-drift"
                style={{ animationDelay: "-4s" }}
              />
              <div
                className="absolute w-1 h-1 rounded-full bg-white/10 top-[40%] left-[60%] animate-drift-slow"
                style={{ animationDelay: "-5s" }}
              />
            </div>
            <div className="hidden sm:block absolute top-0 right-1/4 w-72 h-72 bg-teal/[0.10] rounded-full blur-3xl" />
            <div className="hidden sm:block absolute bottom-0 left-1/3 w-96 h-96 bg-gold/[0.04] rounded-full blur-3xl" />
            <div className="hidden sm:block absolute right-6 bottom-4 text-foreground/[0.02] pointer-events-none select-none">
              <Plane className="w-32 h-32 md:w-48 md:h-48" />
            </div>

            <div className="relative p-4 md:p-8">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                  <span className="relative rounded-full bg-success h-2 w-2" />
                </span>
                <span className="text-xs tracking-wide text-muted-foreground font-medium">
                  {selectedOwner
                    ? (owners.find((o) => o.id === selectedOwner)?.name ?? "Sistema")
                    : "Investimento em Pontos"}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>

              <AltitudeBar
                value={currentMetrics.totalMiles}
                goal={300000}
                className="mb-5"
                color="linear-gradient(90deg, hsl(var(--teal)), hsl(var(--gold)))"
              />

              <BalanceReconcileBanner
                computedTotal={currentMetrics.totalMiles}
                accounts={selectedOwner ? filteredAccounts : pontosAccounts}
              />

              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 sm:gap-3">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-foreground tracking-tight leading-none tabular-nums">
                      <AnimatedNumber value={currentMetrics.totalMiles} />
                    </h1>
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide font-display">
                      pontos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <Wallet className="w-3 h-3 text-teal shrink-0" />
                        <span className="truncate">Total Investido</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-teal tabular-nums">
                        R$ <AnimatedNumber value={currentMetrics.totalInvested} />
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-teal shrink-0" />
                        <span className="truncate">Custo médio/ponto</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-teal tabular-nums">
                        R$ {currentMetrics.avgCostPerMile.toFixed(3)}
                      </p>
                    </div>
                    <div className="p-2 sm:px-3 sm:py-2.5 rounded-xl glass border-border/60 transition-card duration-300 hover:shadow-md">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
                        <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">Contas ativas</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                        {currentMetrics.activeAccounts}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-1 bg-gradient-to-r from-teal/40 via-gold/30 to-teal/20" />
          </section>

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
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
                    <Users className="h-4 w-4 text-primary" />
                    Estoque por Dono (Pontos)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {ownerData.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        title="Nenhum dono com pontos"
                        description="Crie uma conta de pontos e registre transferências para acompanhar seus investimentos."
                      />
                    ) : (
                      ownerData.map((owner) => (
                        <div
                          key={owner.owner}
                          className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
                        >
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-foreground font-display">
                              {owner.owner}
                            </h3>
                            <p className="text-xs text-muted-foreground font-body">
                              {owner.programs.join(", ")} •{" "}
                              <span className="font-semibold">
                                {owner.totalMiles.toLocaleString("pt-BR")} pontos
                              </span>
                            </p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              R$ {owner.totalInvested.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              R$ {owner.avgCost.toFixed(4)}/ponto
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Transferências Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {recentTransfers.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="Nenhuma transferência"
                      description="Transfira pontos entre contas na opção Transferir em Entradas e veja o histórico aqui."
                    />
                  ) : (
                    recentTransfers.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground font-display truncate">
                            {t.sourceAccountName}
                          </h4>
                          <p className="text-xs text-muted-foreground font-body">
                            {formatDateBR(t.date)} • {t.destAccountName}{" "}
                            {t.bonusPercent ? `• +${t.bonusPercent}% bônus` : ""}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5 shrink-0 ml-3">
                          <p className="text-sm font-semibold text-foreground tabular-nums">
                            {t.pointsDebited.toLocaleString("pt-BR")} pts
                          </p>
                          <p className="text-xs text-success tabular-nums">
                            → {t.milesReceived.toLocaleString("pt-BR")} milhas
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
