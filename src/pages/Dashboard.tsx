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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  // Dados integrados do sistema de estoque por donos
  const metrics = {
    totalMiles: 544000, // Estoque real de milhas disponíveis
    totalInvested: 2560, // Total investido em pontos/milhas
    monthlyRevenue: 3120, // Faturamento do mês
    monthlyProfit: 560, // Lucro líquido
    activeAccounts: 3,
    pendingSales: 2,
    cpfAlerts: 1
  };

  const ownerData = [
    { owner: "João Silva", programs: ["LATAM Pass", "Livelo"], totalMiles: 480000, totalInvested: 2200, cpfCount: 18, maxCpf: 22 },
    { owner: "Maria Santos", programs: ["Smiles"], totalMiles: 64000, totalInvested: 360, cpfCount: 15, maxCpf: 22 },
    { owner: "Pedro Costa", programs: ["Esfera"], totalMiles: 0, totalInvested: 0, cpfCount: 8, maxCpf: 22 }
  ];

  const recentSales = [
    { id: 1, owner: "João Silva", client: "Carlos Mendes", program: "LATAM Pass", miles: 50000, value: 300, status: "Concluído" },
    { id: 2, owner: "Maria Santos", client: "Ana Silva", program: "Smiles", miles: 30000, value: 180, status: "Pendente" },
  ];

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
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title="Total Investido"
          value={`R$ ${metrics.totalInvested.toLocaleString('pt-BR')}`}
          subtitle="Capital aplicado"
          icon={Wallet}
          variant="success"
          trend={{ value: 8.2, isPositive: true }}
        />
        <MetricCard
          title="Faturamento Mensal"
          value={`R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}`}
          subtitle="Receita atual"
          icon={DollarSign}
          variant="success"
          trend={{ value: 15.3, isPositive: true }}
        />
        <MetricCard
          title="Lucro Mensal"
          value={`R$ ${metrics.monthlyProfit.toLocaleString('pt-BR')}`}
          subtitle="Ganho líquido"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 18.7, isPositive: true }}
        />
        <MetricCard
          title="Contas Ativas"
          value={metrics.activeAccounts}
          subtitle="Programas disponíveis"
          icon={CreditCard}
        />
      </div>

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
                    R$ {sale.value}
                  </p>
                  <Badge variant={
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