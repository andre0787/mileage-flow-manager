import { useState, useMemo } from "react";
import { BarChart3, TrendingUp, Download, Calendar, Filter, AlertTriangle, Lightbulb, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";

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

  const { owners, accounts, programs, entries, sales } = useData();

  const dateCutoff = useMemo(() => {
    if (selectedPeriod === "custom") return null;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(selectedPeriod));
    return d;
  }, [selectedPeriod]);

  const filteredEntries = useMemo(() => {
    if (!dateCutoff) return entries;
    return entries.filter(e => new Date(e.date) >= dateCutoff!);
  }, [entries, dateCutoff]);

  const filteredSales = useMemo(() => {
    if (!dateCutoff) return sales;
    return sales.filter(s => new Date(s.date) >= dateCutoff!);
  }, [sales, dateCutoff]);

  const ownerReports = useMemo(() => {
    return owners.map(owner => {
      const ownerAccountIds = accounts.filter(a => a.ownerId === owner.id).map(a => a.id);

      const ownerEntries = filteredEntries.filter(e => ownerAccountIds.includes(e.accountId));
      const totalPointsAcquired = ownerEntries.reduce((sum, e) => sum + e.amount, 0);
      const totalAmountInvested = ownerEntries.reduce((sum, e) => sum + e.amountPaid, 0);
      const totalMilesGenerated = ownerEntries.reduce((sum, e) => sum + (e.milesGenerated ?? e.amount), 0);

      const ownerSales = filteredSales.filter(s => ownerAccountIds.includes(s.accountId ?? ""));
      const totalRevenue = ownerSales.reduce((sum, s) => sum + s.saleValue, 0);
      const totalProfit = ownerSales.reduce((sum, s) => sum + s.profit, 0);

      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const roi = totalAmountInvested > 0 ? (totalProfit / totalAmountInvested) * 100 : 0;

      return {
        ownerName: owner.name,
        totalPointsAcquired,
        totalAmountInvested,
        totalMilesGenerated,
        totalRevenue,
        totalProfit,
        profitMargin,
        roi,
      };
    });
  }, [owners, accounts, filteredEntries, filteredSales]);

  const programReports = useMemo(() => {
    return programs.map(program => {
      const programAccounts = accounts.filter(a => a.programId === program.id);
      const totalStock = programAccounts.reduce((sum, a) => sum + a.balance, 0);
      const weightedCost = programAccounts.reduce((sum, a) =>
        sum + (a.averageCostPerMile ?? 0) * a.balance, 0);
      const averageCostPerMile = totalStock > 0 ? weightedCost / totalStock : 0;

      const programSales = filteredSales.filter(s => s.program === program.name);
      const totalSold = programSales.reduce((sum, s) => sum + s.milesUsed, 0);
      const revenue = programSales.reduce((sum, s) => sum + s.saleValue, 0);
      const profit = programSales.reduce((sum, s) => sum + s.profit, 0);

      return {
        program: program.name,
        totalStock,
        averageCostPerMile,
        totalSold,
        revenue,
        profit,
      };
    });
  }, [programs, accounts, filteredSales]);

  const ownerNames = useMemo(() => ["todos", ...owners.map(o => o.name)], [owners]);
  const programNames = useMemo(() => ["todos", ...programs.map(p => p.name)], [programs]);

  const filteredOwnerReports = useMemo(() => {
    if (selectedOwner === "todos") return ownerReports;
    return ownerReports.filter(r => r.ownerName === selectedOwner);
  }, [ownerReports, selectedOwner]);

  const filteredProgramReports = useMemo(() => {
    if (selectedProgram === "todos") return programReports;
    return programReports.filter(r => r.program === selectedProgram);
  }, [programReports, selectedProgram]);

  const periods = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "365", label: "Último ano" },
    { value: "custom", label: "Período personalizado" }
  ];

  const exportReport = (type: "pdf" | "excel") => {
    toast.info(`Exportação em ${type.toUpperCase()} estará disponível em breve`);
  };

  const metrics = useMemo(() => ({
    totalInvested: ownerReports.reduce((sum, r) => sum + r.totalAmountInvested, 0),
    totalRevenue: ownerReports.reduce((sum, r) => sum + r.totalRevenue, 0),
    totalProfit: ownerReports.reduce((sum, r) => sum + r.totalProfit, 0),
    totalStock: programReports.reduce((sum, r) => sum + r.totalStock, 0),
  }), [ownerReports, programReports]);

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
                  {ownerNames.map((owner) => (
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
                  {programNames.map((program) => (
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
              {filteredOwnerReports.map((report) => (
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
              {filteredProgramReports.map((report) => {
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
              <h4 className="font-semibold text-success mb-2 flex items-center gap-2"><Award className="h-4 w-4 text-success" /> Melhor Performance</h4>
              <p className="text-sm">
                {ownerReports.sort((a, b) => b.roi - a.roi)[0]?.ownerName} apresenta o melhor ROI
                ({ownerReports.sort((a, b) => b.roi - a.roi)[0]?.roi.toFixed(1)}%)
              </p>
            </div>

            <div className="p-4 bg-warning-light rounded-lg">
              <h4 className="font-semibold text-warning mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Atenção</h4>
              <p className="text-sm">
                Programa {programReports.sort((a, b) => a.profit - b.profit)[0]?.program}
                com menor lucratividade. Considere revisar estratégia de preços.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Oportunidades</h4>
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
