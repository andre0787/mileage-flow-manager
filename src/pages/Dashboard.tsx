import { useState, useMemo, useCallback } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { FlowMap } from "@/components/FlowMap";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";
import { isTransferencia } from "@/lib/utils";
import type { Account, Sale, PointEntry } from "@/types";

const MAX_CPF_PER_OWNER = 22;

export default function Dashboard() {
  const { owners, accounts, programs, sales, entries, origemTypes } = useData();
  const [activeTab, setActiveTab] = useState<"milhas" | "pontos">("milhas");
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);

  const milhasAccounts = useMemo(() => accounts.filter(a => a.type === "milhas"), [accounts]);
  const pontosAccounts = useMemo(() => accounts.filter(a => a.type === "pontos"), [accounts]);

  const milhasSales = useMemo(
    () => sales.filter(s => {
      if (!s.accountId) return false;
      const acct = accounts.find(a => a.id === s.accountId);
      return acct?.type === "milhas";
    }),
    [sales, accounts]
  );

  const pontosSales = useMemo(() => [], []);

  const milhasEntries = useMemo(
    () => entries.filter(e => {
      const acct = accounts.find(a => a.id === e.accountId);
      return acct?.type === "milhas";
    }),
    [entries, accounts]
  );

  const pontosEntries = useMemo(
    () => entries.filter(e => {
      const acct = accounts.find(a => a.id === e.accountId);
      return acct?.type === "pontos";
    }),
    [entries, accounts]
  );

  const currentAccounts = activeTab === "milhas" ? milhasAccounts : pontosAccounts;
  const currentSales = activeTab === "milhas" ? milhasSales : pontosSales;
  const currentEntries = activeTab === "milhas" ? milhasEntries : pontosEntries;
  const unitLabel = activeTab === "milhas" ? "Milhas" : "Pontos";

  const computeMetrics = useCallback((accts: Account[], sls: Sale[], entrs: PointEntry[]) => {
    const activeSales = sls.filter(s => s.status !== "cancelado");
    const totalMiles = accts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = accts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
    const activeAccounts = accts.filter(a => a.status === "ativa").length;
    const pendingSales = activeSales.filter(s => s.status === "pendente").length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlySales = activeSales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.saleValue, 0);
    const monthlyProfit = monthlySales.reduce((sum, s) => sum + s.profit, 0);
    const totalSoldMiles = activeSales.reduce((sum, s) => sum + s.milesUsed, 0);
    const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
    const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0);
    const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgCostPerMile = totalMiles > 0 ? totalInvested / totalMiles : 0;

    const monthlyEntries = entrs.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyMilesIn = monthlyEntries.reduce((sum, e) => sum + e.amount, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthSales = activeSales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });
    const prevRevenue = prevMonthSales.reduce((sum, s) => sum + s.saleValue, 0);
    const revenueChange = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const cpfAlerts = owners.filter(o => {
      const ownerAccountIds = accts.filter(a => a.ownerId === o.id).map(a => a.id);
      const ownerSales = activeSales.filter(s => ownerAccountIds.includes(s.accountId ?? ""));
      const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
      return usedCpfs.size >= MAX_CPF_PER_OWNER - 4;
    }).length;

    return {
      totalMiles, totalInvested, monthlyRevenue, monthlyProfit,
      activeAccounts, pendingSales, cpfAlerts,
      totalSoldMiles, totalRevenue, totalProfit,
      avgProfitMargin, avgCostPerMile, monthlyMilesIn, revenueChange,
    };
  }, [owners]);

  const filteredAccounts = useMemo(
    () => !selectedOwner ? currentAccounts : currentAccounts.filter(a => a.ownerId === selectedOwner),
    [currentAccounts, selectedOwner]
  );

  const filteredSales = useMemo(
    () => !selectedOwner ? currentSales : currentSales.filter(s => {
      const acct = accounts.find(a => a.id === s.accountId);
      return acct?.ownerId === selectedOwner;
    }),
    [currentSales, selectedOwner, accounts]
  );

  const filteredEntries = useMemo(
    () => !selectedOwner ? currentEntries : currentEntries.filter(e => {
      const acct = accounts.find(a => a.id === e.accountId);
      return acct?.ownerId === selectedOwner;
    }),
    [currentEntries, selectedOwner, accounts]
  );

  const currentMetrics = useMemo(
    () => computeMetrics(filteredAccounts, filteredSales, filteredEntries),
    [computeMetrics, filteredAccounts, filteredSales, filteredEntries]
  );

  const filteredMilhasAccounts = useMemo(
    () => !selectedOwner ? milhasAccounts : milhasAccounts.filter(a => a.ownerId === selectedOwner),
    [milhasAccounts, selectedOwner]
  );

  const filteredMilhasSales = useMemo(
    () => !selectedOwner ? milhasSales : milhasSales.filter(s => {
      const acct = accounts.find(a => a.id === s.accountId);
      return acct?.ownerId === selectedOwner;
    }),
    [milhasSales, selectedOwner, accounts]
  );

  const filteredMilhasEntries = useMemo(
    () => !selectedOwner ? milhasEntries : milhasEntries.filter(e => {
      const acct = accounts.find(a => a.id === e.accountId);
      return acct?.ownerId === selectedOwner;
    }),
    [milhasEntries, selectedOwner, accounts]
  );

  const financialMetrics = useMemo(
    () => computeMetrics(filteredMilhasAccounts, filteredMilhasSales, filteredMilhasEntries),
    [computeMetrics, filteredMilhasAccounts, filteredMilhasSales, filteredMilhasEntries]
  );

  const ownerData = useMemo(() => {
    return owners.map(owner => {
      const ownerAccounts = filteredAccounts.filter(a => a.ownerId === owner.id);
      const ownerAccountIds = ownerAccounts.map(a => a.id);
      const totalMiles = ownerAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalInvested = ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
      const programIds = [...new Set(ownerAccounts.map(a => a.programId))];
      const programNames = programIds.map(id => programs.find(p => p.id === id)?.name ?? id);
      const ownerSales = filteredSales.filter(s => s.status !== "cancelado" && ownerAccountIds.includes(s.accountId ?? ""));
      const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
      const avgCost = totalMiles > 0 ? totalInvested / totalMiles : 0;
      return { owner: owner.name, programs: programNames, totalMiles, totalInvested, avgCost, cpfCount: usedCpfs.size, maxCpf: MAX_CPF_PER_OWNER };
    }).filter(o => o.totalMiles > 0 || o.totalInvested > 0);
  }, [owners, filteredAccounts, programs, filteredSales]);

  const recentSales = useMemo(() => {
    return [...filteredSales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
      .map(s => ({
        id: s.id, owner: s.ownerName, client: s.clientName, program: s.program,
        miles: s.milesUsed, value: s.saleValue,
        status: s.status === "concluido" ? "Concluído" : s.status === "pago" ? "Pago" : s.status === "cancelado" ? "Cancelado" : "Pendente",
        statusColor: s.status === "concluido" ? "success" : s.status === "pago" ? "secondary" : s.status === "cancelado" ? "destructive" : "outline" as const,
      }));
  }, [filteredSales]);

  const programData = useMemo(() => {
    const programMap = new Map<string, number>();
    filteredAccounts.forEach(a => {
      const progName = programs.find(p => p.id === a.programId)?.name ?? "Desconhecido";
      programMap.set(progName, (programMap.get(progName) ?? 0) + a.balance);
    });
    return Array.from(programMap.entries()).map(([name, value]) => ({ name, value, color: "hsl(230 65% 50%)" }));
  }, [filteredAccounts, programs]);

  const monthlySales = useMemo(() => {
    const monthMap = new Map<string, { vendas: number; lucro: number }>();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    filteredSales.filter(s => s.status !== "cancelado").forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const current = monthMap.get(key) ?? { vendas: 0, lucro: 0 };
      current.vendas += s.saleValue;
      current.lucro += s.profit;
      monthMap.set(key, current);
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b)).slice(-12)
      .map(([key, data]) => {
        const [yearStr, monthStr] = key.split("-");
        return { month: `${monthNames[parseInt(monthStr)]}/${yearStr.slice(2)}`, vendas: data.vendas, lucro: data.lucro };
      });
  }, [filteredSales]);

  const recentEntries = useMemo(() => {
    return [...filteredEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
      .map(e => ({
        id: e.id,
        amount: e.amount,
        accountName: accounts.find(a => a.id === e.accountId)?.name ?? "",
      }));
  }, [filteredEntries, accounts]);

  const recentTransfers = useMemo(() => {
    const transferOrigemIds = new Set(origemTypes.filter(ot => isTransferencia(ot)).map(ot => ot.id));
    return [...filteredEntries]
      .filter(e => e.sourceAccountId && transferOrigemIds.has(e.origemTypeId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
      .map(e => {
        const srcAccount = accounts.find(a => a.id === e.sourceAccountId);
        const dstAccount = accounts.find(a => a.id === e.accountId);
        return {
          id: e.id,
          date: e.date,
          sourceAccountName: srcAccount?.name ?? "",
          pointsDebited: e.amount,
          bonusPercent: e.bonusPercent,
          milesReceived: e.milesGenerated ?? e.amount,
          destAccountName: dstAccount?.name ?? "",
        };
      });
  }, [filteredEntries, accounts, origemTypes]);

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
            {owners.map(o => (
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

        {/* ═══════════════════════════════════════════ */}
        {/* MILHAS TAB */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="milhas" className="space-y-6 mt-6">
          {/* HERO — ALTÍMETRO */}
          <section className="relative overflow-hidden rounded-2xl border border-primary/15 shadow-elegant animate-appear">
            <div className="absolute inset-0 bg-gradient-hero bg-[length:200%_200%] animate-gradient-shift" />
            <div className="absolute inset-0 hero-glow" />
            <div className="absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full bg-primary/30 top-[15%] left-[10%] animate-drift" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-gold/40 top-[25%] right-[20%] animate-drift-slow" style={{ animationDelay: "-2s" }} />
              <div className="absolute w-1 h-1 rounded-full bg-teal/30 top-[60%] left-[30%] animate-drift" style={{ animationDelay: "-3s" }} />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-primary/20 bottom-[20%] right-[15%] animate-drift-slow" style={{ animationDelay: "-1s" }} />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-gold/25 top-[70%] right-[40%] animate-drift" style={{ animationDelay: "-4s" }} />
              <div className="absolute w-1 h-1 rounded-full bg-white/20 top-[40%] left-[60%] animate-drift-slow" style={{ animationDelay: "-5s" }} />
            </div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gold/[0.05] rounded-full blur-3xl" />
            <div className="absolute right-6 bottom-4 text-foreground/[0.025] pointer-events-none select-none">
              <Plane className="w-32 h-32 md:w-48 md:h-48" />
            </div>

            <div className="relative p-6 md:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                  <span className="relative rounded-full bg-success h-2 w-2" />
                </span>
                <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium">
                  {selectedOwner ? owners.find(o => o.id === selectedOwner)?.name ?? "Sistema" : "Sistema Operacional"}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-none">
                      <AnimatedNumber value={currentMetrics.totalMiles} />
                    </h1>
                    <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase font-display hidden sm:inline">
                      milhas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mt-6">
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <ArrowUpRight className="w-3 h-3 text-success" />
                        Entradas no mês
                      </div>
                      <p className="font-mono text-sm font-bold text-success">
                        +<AnimatedNumber value={currentMetrics.monthlyMilesIn} />
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <ArrowDownRight className="w-3 h-3 text-gold" />
                        Milhas vendidas
                      </div>
                      <p className="font-mono text-sm font-bold text-gold">
                        <AnimatedNumber value={currentMetrics.totalSoldMiles} />
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-teal" />
                        Custo médio/milha
                      </div>
                      <p className="font-mono text-sm font-bold text-teal">
                        R$ {currentMetrics.avgCostPerMile.toFixed(3)}
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Contas ativas
                      </div>
                      <p className="font-mono text-sm font-bold text-primary">
                        {currentMetrics.activeAccounts}
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-primary/20">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <Target className="w-3 h-3 text-success" />
                        Margem Média
                      </div>
                      <p className="font-mono text-sm font-bold text-success">
                        {financialMetrics.avgProfitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-gold/20">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-gold" />
                        Receita Total
                      </div>
                      <p className="font-mono text-sm font-bold text-gold">
                        R$ <AnimatedNumber value={financialMetrics.totalRevenue} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-1 bg-gradient-to-r from-primary/30 via-gold/30 to-teal/30" />
          </section>

          {/* METRIC CARDS */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-appear animate-delay-200">
            <MetricCard title="Total Investido" value={financialMetrics.totalInvested} subtitle="Capital aplicado" icon={Wallet} variant="gold" prefix="R$" trend={{ value: Math.round(financialMetrics.revenueChange), isPositive: financialMetrics.revenueChange >= 0 }} />
            <MetricCard title="Faturamento Mensal" value={financialMetrics.monthlyRevenue} subtitle="Receita do mês" icon={DollarSign} variant="success" prefix="R$" />
            <MetricCard title="Lucro Mensal" value={financialMetrics.monthlyProfit} subtitle="Ganho líquido" icon={TrendingUp} variant="teal" prefix="R$" />
            <MetricCard title="Margem de Lucro" value={`${financialMetrics.avgProfitMargin.toFixed(1)}%`} subtitle="Sobre receita total" icon={Target} variant="default" />
          </div>

          {/* FLOW MAP */}
          <div className="animate-appear animate-delay-400">
            <FlowMap totalMiles={currentMetrics.totalMiles} activeAccounts={currentMetrics.activeAccounts} totalSoldMiles={currentMetrics.totalSoldMiles} totalRevenue={financialMetrics.totalRevenue} ownersCount={selectedOwner ? 1 : owners.length} unitLabel="Milhas" />
          </div>

          {/* CHARTS */}
          <div className="animate-appear animate-delay-600">
            <DashboardCharts programData={programData} monthlySales={monthlySales} unitLabel="Milhas" />
          </div>

          {/* SECONDARY METRICS */}
          <div className="grid gap-4 md:grid-cols-3 animate-appear animate-delay-800">
            <MetricCard title="Contas Ativas" value={currentMetrics.activeAccounts} subtitle="Contas operacionais" icon={CreditCard} variant="teal" />
            <MetricCard title="Vendas Pendentes" value={currentMetrics.pendingSales} subtitle="Aguardando processamento" icon={Target} variant="default" />
            <MetricCard title="Alertas CPF" value={currentMetrics.cpfAlerts} subtitle="Próximo ao limite" icon={AlertTriangle} variant="warning" />
          </div>

          {/* OWNER + SALES */}
          <div className={`grid gap-4 ${selectedOwner ? "md:grid-cols-1" : "md:grid-cols-2"} animate-appear animate-delay-1000`}>
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
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado para exibir</p>
                    ) : (
                      ownerData.map((owner) => (
                        <div key={owner.owner} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-foreground font-display">{owner.owner}</h3>
                            <p className="text-xs text-muted-foreground font-body">{owner.programs.join(", ")} • <span className="font-mono">{owner.totalMiles.toLocaleString("pt-BR")} milhas</span></p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="font-mono text-sm font-semibold text-foreground">R$ {owner.totalInvested.toLocaleString("pt-BR")}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">R$ {owner.avgCost.toFixed(4)}/milha</p>
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-[10px] text-muted-foreground font-mono">CPFs: {owner.cpfCount}/{owner.maxCpf}</span>
                              <Badge variant={owner.cpfCount >= 20 ? "destructive" : owner.cpfCount >= 18 ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">{owner.cpfCount >= 20 ? "Crítico" : owner.cpfCount >= 18 ? "Atenção" : "OK"}</Badge>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda registrada</p>
                  ) : (
                    recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground font-display truncate">{sale.client}</h4>
                          <p className="text-xs text-muted-foreground font-body truncate">{sale.owner} • {sale.program} • <span className="font-mono">{sale.miles.toLocaleString("pt-BR")} milhas</span></p>
                        </div>
                        <div className="text-right space-y-0.5 shrink-0 ml-3">
                          <p className="font-mono text-sm font-semibold text-foreground">R$ {sale.value.toLocaleString("pt-BR")}</p>
                          <Badge variant={sale.statusColor} className="text-[10px] px-1.5 py-0">{sale.status}</Badge>
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
          <section className="relative overflow-hidden rounded-2xl border border-primary/15 shadow-elegant animate-appear">
            <div className="absolute inset-0 bg-gradient-hero bg-[length:200%_200%] animate-gradient-shift" />
            <div className="absolute inset-0 hero-glow" />
            <div className="absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full bg-primary/30 top-[15%] left-[10%] animate-drift" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-gold/40 top-[25%] right-[20%] animate-drift-slow" style={{ animationDelay: "-2s" }} />
              <div className="absolute w-1 h-1 rounded-full bg-teal/30 top-[60%] left-[30%] animate-drift" style={{ animationDelay: "-3s" }} />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-primary/20 bottom-[20%] right-[15%] animate-drift-slow" style={{ animationDelay: "-1s" }} />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-gold/25 top-[70%] right-[40%] animate-drift" style={{ animationDelay: "-4s" }} />
              <div className="absolute w-1 h-1 rounded-full bg-white/20 top-[40%] left-[60%] animate-drift-slow" style={{ animationDelay: "-5s" }} />
            </div>
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/[0.06] rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gold/[0.05] rounded-full blur-3xl" />
            <div className="absolute right-6 bottom-4 text-foreground/[0.025] pointer-events-none select-none">
              <Plane className="w-32 h-32 md:w-48 md:h-48" />
            </div>

            <div className="relative p-6 md:p-8">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                  <span className="relative rounded-full bg-success h-2 w-2" />
                </span>
                <span className="text-[10px] font-mono tracking-[0.2em] text-muted-foreground uppercase font-medium">
                  {selectedOwner ? owners.find(o => o.id === selectedOwner)?.name ?? "Sistema" : "Investimento em Pontos"}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3">
                    <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-none">
                      <AnimatedNumber value={currentMetrics.totalMiles} />
                    </h1>
                    <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase font-display hidden sm:inline">
                      pontos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mt-6">
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <Wallet className="w-3 h-3 text-teal" />
                        Total Investido
                      </div>
                      <p className="font-mono text-sm font-bold text-teal">
                        R$ <AnimatedNumber value={currentMetrics.totalInvested} />
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <DollarSign className="w-3 h-3 text-teal" />
                        Custo médio/ponto
                      </div>
                      <p className="font-mono text-sm font-bold text-teal">
                        R$ {currentMetrics.avgCostPerMile.toFixed(3)}
                      </p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-background/60 border border-border/60">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        Contas ativas
                      </div>
                      <p className="font-mono text-sm font-bold text-primary">
                        {currentMetrics.activeAccounts}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-1 bg-gradient-to-r from-primary/30 via-gold/30 to-teal/30" />
          </section>

          {/* CHARTS — só pizza */}
          <div className="animate-appear animate-delay-600">
            <DashboardCharts programData={programData} monthlySales={monthlySales} unitLabel="Pontos" hideBarChart />
          </div>

          {/* SECONDARY METRICS */}
          <div className="grid gap-4 md:grid-cols-1 animate-appear animate-delay-800">
            <MetricCard title="Contas Ativas (Pontos)" value={currentMetrics.activeAccounts} subtitle="Contas de pontos operacionais" icon={CreditCard} variant="teal" />
          </div>

          {/* OWNER + TRANSFERS */}
          <div className={`grid gap-4 ${selectedOwner ? "md:grid-cols-1" : "md:grid-cols-2"} animate-appear animate-delay-1000`}>
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
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado para exibir</p>
                    ) : (
                      ownerData.map((owner) => (
                        <div key={owner.owner} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
                          <div className="space-y-0.5">
                            <h3 className="font-semibold text-sm text-foreground font-display">{owner.owner}</h3>
                            <p className="text-xs text-muted-foreground font-body">{owner.programs.join(", ")} • <span className="font-mono">{owner.totalMiles.toLocaleString("pt-BR")} pontos</span></p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="font-mono text-sm font-semibold text-foreground">R$ {owner.totalInvested.toLocaleString("pt-BR")}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">R$ {owner.avgCost.toFixed(4)}/ponto</p>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transferência registrada</p>
                  ) : (
                    recentTransfers.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50">
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-semibold text-sm text-foreground font-display truncate">{t.sourceAccountName}</h4>
                          <p className="text-xs text-muted-foreground font-body">{new Date(t.date).toLocaleDateString("pt-BR")} • {t.destAccountName} {t.bonusPercent ? `• +${t.bonusPercent}% bônus` : ""}</p>
                        </div>
                        <div className="text-right space-y-0.5 shrink-0 ml-3">
                          <p className="font-mono text-sm font-semibold text-foreground">{t.pointsDebited.toLocaleString("pt-BR")} pts</p>
                          <p className="text-[10px] text-success font-mono">→ {t.milesReceived.toLocaleString("pt-BR")} milhas</p>
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
