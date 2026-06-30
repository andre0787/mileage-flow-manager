import { useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  CreditCard,
  Target,
  AlertTriangle,
  Coins,
  DollarSign
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";

const MAX_CPF_PER_OWNER = 22;

export default function Dashboard() {
  const { owners, accounts, programs, sales, entries } = useData();

  const metrics = useMemo(() => {
    const activeSales = sales.filter(s => s.status !== "cancelado");
    const totalMiles = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalInvested = accounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
    const activeAccounts = accounts.filter(a => a.status === "ativa").length;
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
    const monthChange = ((monthlyRevenue - monthlyProfit) / (monthlyRevenue || 1)) * 100;

    const cpfAlerts = owners.filter(o => {
      const ownerAccountIds = accounts.filter(a => a.ownerId === o.id).map(a => a.id);
      const ownerSales = activeSales.filter(s => ownerAccountIds.includes(s.accountId ?? ""));
      const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));
      return usedCpfs.size >= MAX_CPF_PER_OWNER - 4;
    }).length;

    return {
      totalMiles,
      totalInvested,
      monthlyRevenue,
      monthlyProfit,
      activeAccounts,
      pendingSales,
      cpfAlerts,
      totalSoldMiles,
      totalRevenue,
      totalProfit,
      monthChange,
    };
  }, [accounts, sales, owners]);

  const ownerData = useMemo(() => {
    return owners.map(owner => {
      const ownerAccounts = accounts.filter(a => a.ownerId === owner.id);
      const ownerAccountIds = ownerAccounts.map(a => a.id);
      const totalMiles = ownerAccounts.reduce((sum, a) => sum + a.balance, 0);
      const totalInvested = ownerAccounts.reduce((sum, a) => sum + (a.totalInvested ?? 0), 0);
      const programIds = [...new Set(ownerAccounts.map(a => a.programId))];
      const programNames = programIds.map(id => programs.find(p => p.id === id)?.name ?? id);

      const ownerSales = sales.filter(s => s.status !== "cancelado" && ownerAccountIds.includes(s.accountId ?? ""));
      const usedCpfs = new Set(ownerSales.flatMap(s => s.passengers.map(p => p.cpf)));

      return {
        owner: owner.name,
        programs: programNames,
        totalMiles,
        totalInvested,
        cpfCount: usedCpfs.size,
        maxCpf: MAX_CPF_PER_OWNER,
      };
    });
  }, [owners, accounts, programs, sales]);

  const recentSales = useMemo(() => {
    const lastSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return lastSales.slice(0, 5).map(s => ({
      id: s.id,
      owner: s.ownerName,
      client: s.clientName,
      program: s.program,
      miles: s.milesUsed,
      value: s.saleValue,
      status: s.status === "concluido" ? "Concluído" : s.status === "pago" ? "Pago" : s.status === "cancelado" ? "Cancelado" : "Pendente",
    }));
  }, [sales]);

  const programData = useMemo(() => {
    const programMap = new Map<string, number>();
    accounts.forEach(a => {
      const progName = programs.find(p => p.id === a.programId)?.name ?? "Desconhecido";
      programMap.set(progName, (programMap.get(progName) ?? 0) + a.balance);
    });
    return Array.from(programMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: "hsl(221 83% 53%)",
    }));
  }, [accounts, programs]);

  const monthlySales = useMemo(() => {
    const monthMap = new Map<string, { vendas: number; lucro: number }>();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    sales.filter(s => s.status !== "cancelado").forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      const current = monthMap.get(key) ?? { vendas: 0, lucro: 0 };
      current.vendas += s.saleValue;
      current.lucro += s.profit;
      monthMap.set(key, current);
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, data]) => {
        const [yearStr, monthStr] = key.split("-");
        const label = `${monthNames[parseInt(monthStr)]}/${yearStr.slice(2)}`;
        return {
          month: label,
          vendas: data.vendas,
          lucro: data.lucro,
        };
      });
  }, [sales]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu sistema de controle de milhas
        </p>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Estoque de Milhas"
          value={metrics.totalMiles.toLocaleString('pt-BR')}
          subtitle="Milhas disponíveis"
          icon={Coins}
        />
        <MetricCard
          title="Total Investido"
          value={`R$ ${metrics.totalInvested.toLocaleString('pt-BR')}`}
          subtitle="Capital aplicado"
          icon={Wallet}
          variant="success"
        />
        <MetricCard
          title="Faturamento Mensal"
          value={`R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}`}
          subtitle="Receita atual"
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Lucro Mensal"
          value={`R$ ${metrics.monthlyProfit.toLocaleString('pt-BR')}`}
          subtitle="Ganho líquido"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      <DashboardCharts programData={programData} monthlySales={monthlySales} />

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Contas Ativas"
          value={metrics.activeAccounts}
          subtitle="Contas operacionais"
          icon={CreditCard}
        />
        <MetricCard
          title="Vendas Pendentes"
          value={metrics.pendingSales}
          subtitle="Aguardando processamento"
          icon={Target}
        />
        <MetricCard
          title="Alertas CPF"
          value={metrics.cpfAlerts}
          subtitle="Próximo ao limite"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Owner Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Estoque por Dono
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ownerData.map((owner) => (
              <div key={owner.owner} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium text-foreground">{owner.owner}</h3>
                  <p className="text-sm text-muted-foreground">
                    {owner.programs.join(", ")} • {owner.totalMiles.toLocaleString('pt-BR')} milhas
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-foreground">
                    R$ {owner.totalInvested.toLocaleString('pt-BR')} investido
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      CPFs: {owner.cpfCount}/{owner.maxCpf}
                    </span>
                    <Badge variant={owner.cpfCount >= 20 ? "destructive" : owner.cpfCount >= 18 ? "secondary" : "outline"}>
                      {owner.cpfCount >= 20 ? "Crítico" : owner.cpfCount >= 18 ? "Atenção" : "OK"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Vendas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">{sale.client}</h4>
                  <p className="text-sm text-muted-foreground">
                    {sale.owner} • {sale.program} • {sale.miles.toLocaleString('pt-BR')} milhas
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-foreground">
                    R$ {sale.value.toLocaleString('pt-BR')}
                  </p>
                  <Badge variant={
                    sale.status === "Cancelado" ? "destructive" :
                    sale.status === "Concluído" ? "default" :
                    sale.status === "Pago" ? "secondary" : "outline"
                  }>
                    {sale.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
