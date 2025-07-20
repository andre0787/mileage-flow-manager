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
  // Mock data - será substituído por dados reais posteriormente
  const metrics = {
    totalMiles: 2450000,
    totalValue: 12250,
    monthlyProfit: 3840,
    activeAccounts: 15,
    pendingSales: 8,
    cpfAlerts: 2
  };

  const programData = [
    { program: "LATAM Pass", miles: 850000, value: 4250, cpfCount: 18, maxCpf: 22 },
    { program: "Smiles", miles: 720000, value: 3600, cpfCount: 15, maxCpf: 22 },
    { program: "Livelo", miles: 580000, value: 2900, cpfCount: 12, maxCpf: 22 },
    { program: "Esfera", miles: 300000, value: 1500, cpfCount: 8, maxCpf: 22 }
  ];

  const recentSales = [
    { id: 1, client: "João Silva", program: "LATAM Pass", miles: 50000, value: 250, status: "Concluído" },
    { id: 2, client: "Maria Santos", program: "Smiles", miles: 75000, value: 375, status: "Pendente" },
    { id: 3, client: "Pedro Costa", program: "Livelo", miles: 30000, value: 150, status: "Pago" },
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
          title="Total de Milhas"
          value={metrics.totalMiles.toLocaleString('pt-BR')}
          subtitle="Estoque atual"
          icon={Coins}
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title="Valor do Estoque"
          value={`R$ ${metrics.totalValue.toLocaleString('pt-BR')}`}
          subtitle="Valor total investido"
          icon={Wallet}
          variant="success"
          trend={{ value: 8.2, isPositive: true }}
        />
        <MetricCard
          title="Lucro Mensal"
          value={`R$ ${metrics.monthlyProfit.toLocaleString('pt-BR')}`}
          subtitle="Ganho atual"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 15.3, isPositive: true }}
        />
        <MetricCard
          title="Contas Ativas"
          value={metrics.activeAccounts}
          subtitle="Programas disponíveis"
          icon={CreditCard}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
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

      {/* Program Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Estoque por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programData.map((program) => (
              <div key={program.program} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <h3 className="font-medium text-foreground">{program.program}</h3>
                  <p className="text-sm text-muted-foreground">
                    {program.miles.toLocaleString('pt-BR')} milhas
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-foreground">
                    R$ {program.value.toLocaleString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      CPFs: {program.cpfCount}/{program.maxCpf}
                    </span>
                    <Badge variant={program.cpfCount >= 20 ? "destructive" : program.cpfCount >= 18 ? "secondary" : "outline"}>
                      {program.cpfCount >= 20 ? "Crítico" : program.cpfCount >= 18 ? "Atenção" : "OK"}
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
                    {sale.program} • {sale.miles.toLocaleString('pt-BR')} milhas
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