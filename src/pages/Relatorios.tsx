import { useState } from "react";
import { BarChart3, TrendingUp, Download, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OwnerReport {
  ownerName: string;
  totalPointsAcquired: number;
  totalAmountInvested: number;
  totalMilesGenerated: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  roi: number;
}

interface ProgramReport {
  program: string;
  totalStock: number;
  averageCostPerMile: number;
  totalSold: number;
  revenue: number;
  profit: number;
}

export default function Relatorios() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [selectedOwner, setSelectedOwner] = useState("todos");
  const [selectedProgram, setSelectedProgram] = useState("todos");

  // Mock data - seria substituído por dados reais da API
  const ownerReports: OwnerReport[] = [
    {
      ownerName: "João Silva",
      totalPointsAcquired: 500000,
      totalAmountInvested: 2250,
      totalMilesGenerated: 450000,
      totalRevenue: 2700,
      totalProfit: 450,
      profitMargin: 16.67,
      roi: 20
    },
    {
      ownerName: "Maria Santos",
      totalPointsAcquired: 200000,
      totalAmountInvested: 900,
      totalMilesGenerated: 160000,
      totalRevenue: 1080,
      totalProfit: 180,
      profitMargin: 16.67,
      roi: 20
    }
  ];

  const programReports: ProgramReport[] = [
    {
      program: "LATAM Pass",
      totalStock: 400000,
      averageCostPerMile: 0.0045,
      totalSold: 150000,
      revenue: 900,
      profit: 225
    },
    {
      program: "Smiles",
      totalStock: 160000,
      averageCostPerMile: 0.005625,
      totalSold: 80000,
      revenue: 480,
      profit: 30
    },
    {
      program: "Livelo",
      totalStock: 80000,
      averageCostPerMile: 0.005,
      totalSold: 40000,
      revenue: 240,
      profit: 40
    }
  ];

  const periods = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "365", label: "Último ano" },
    { value: "custom", label: "Período personalizado" }
  ];

  const owners = ["todos", ...ownerReports.map(r => r.ownerName)];
  const programs = ["todos", ...programReports.map(r => r.program)];

  const exportReport = (type: "pdf" | "excel") => {
    // Implementar exportação
    console.log(`Exportando relatório em ${type}`);
  };

  const getTotalMetrics = () => {
    return {
      totalInvested: ownerReports.reduce((sum, r) => sum + r.totalAmountInvested, 0),
      totalRevenue: ownerReports.reduce((sum, r) => sum + r.totalRevenue, 0),
      totalProfit: ownerReports.reduce((sum, r) => sum + r.totalProfit, 0),
      totalStock: programReports.reduce((sum, r) => sum + r.totalStock, 0)
    };
  };

  const metrics = getTotalMetrics();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise completa de performance e rentabilidade por dono
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportReport("excel")} className="gap-2">
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport("pdf")} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período:</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dono:</label>
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner === "todos" ? "Todos os Donos" : owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Programa:</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program === "todos" ? "Todos os Programas" : program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ação:</label>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {metrics.totalInvested.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {metrics.totalRevenue.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metrics.totalProfit.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalStock.toLocaleString('pt-BR')} milhas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owner Performance Report */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance por Dono
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dono</TableHead>
                <TableHead>Pontos Adquiridos</TableHead>
                <TableHead>Investimento</TableHead>
                <TableHead>Milhas Geradas</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerReports.map((report) => (
                <TableRow key={report.ownerName}>
                  <TableCell className="font-medium">{report.ownerName}</TableCell>
                  <TableCell>{report.totalPointsAcquired.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {report.totalAmountInvested.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{report.totalMilesGenerated.toLocaleString('pt-BR')}</TableCell>
                  <TableCell>R$ {report.totalRevenue.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="font-semibold text-success">
                    R$ {report.totalProfit.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.profitMargin.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.roi >= 20 ? "default" : "secondary"}>
                      {report.roi.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Program Performance Report */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programa</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Custo Médio/Milha</TableHead>
                <TableHead>Milhas Vendidas</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programReports.map((report) => {
                const stockUtilization = (report.totalSold / (report.totalStock + report.totalSold)) * 100;
                return (
                  <TableRow key={report.program}>
                    <TableCell className="font-medium">{report.program}</TableCell>
                    <TableCell>{report.totalStock.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>R$ {report.averageCostPerMile.toFixed(4)}</TableCell>
                    <TableCell>{report.totalSold.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>R$ {report.revenue.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-semibold text-success">
                      R$ {report.profit.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stockUtilization >= 50 ? "default" : "outline"}>
                        {stockUtilization.toFixed(1)}% vendido
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-success-light rounded-lg">
              <h4 className="font-semibold text-success mb-2">✓ Melhor Performance</h4>
              <p className="text-sm">
                {ownerReports.sort((a, b) => b.roi - a.roi)[0]?.ownerName} apresenta o melhor ROI 
                ({ownerReports.sort((a, b) => b.roi - a.roi)[0]?.roi.toFixed(1)}%)
              </p>
            </div>
            
            <div className="p-4 bg-warning-light rounded-lg">
              <h4 className="font-semibold text-warning mb-2">⚠ Atenção</h4>
              <p className="text-sm">
                Programa {programReports.sort((a, b) => a.profit - b.profit)[0]?.program} 
                com menor lucratividade. Considere revisar estratégia de preços.
              </p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">📊 Oportunidades</h4>
              <p className="text-sm">
                Estoque total de {metrics.totalStock.toLocaleString('pt-BR')} milhas disponível. 
                Considere campanhas promocionais para acelerar vendas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}