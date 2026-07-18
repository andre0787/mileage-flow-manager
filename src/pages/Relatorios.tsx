import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  AlertTriangle,
  Lightbulb,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { calcProfitMargin, calcROI, calcWeightedAverageCost } from "@/lib/metrics";
import { downloadCSV } from "@/lib/utils";
import { PERIOD_OPTIONS } from "@/lib/dates";

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

  const { owners, accounts, programs, entries, sales, isLoading } = useData();

  const dateCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(selectedPeriod));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedPeriod]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => new Date(e.date) >= dateCutoff);
  }, [entries, dateCutoff]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => new Date(s.date) >= dateCutoff);
  }, [sales, dateCutoff]);

  const ownerReports = useMemo(() => {
    return owners.map((owner) => {
      const ownerAccountIds = accounts.filter((a) => a.ownerId === owner.id).map((a) => a.id);

      const ownerEntries = filteredEntries.filter((e) => ownerAccountIds.includes(e.accountId));
      const totalPointsAcquired = ownerEntries.reduce((sum, e) => sum + e.amount, 0);
      const totalAmountInvested = ownerEntries.reduce((sum, e) => sum + e.amountPaid, 0);
      const totalMilesGenerated = ownerEntries.reduce(
        (sum, e) => sum + (e.milesGenerated ?? e.amount),
        0,
      );

      const ownerSales = filteredSales.filter((s) => ownerAccountIds.includes(s.accountId ?? ""));
      const totalRevenue = ownerSales.reduce((sum, s) => sum + s.saleValue, 0);
      const totalProfit = ownerSales.reduce((sum, s) => sum + s.profit, 0);

      const profitMargin = calcProfitMargin(totalProfit, totalRevenue);
      const roi = calcROI(totalProfit, totalAmountInvested);

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
    return programs.map((program) => {
      const programAccounts = accounts.filter((a) => a.programId === program.id);
      const totalStock = programAccounts.reduce((sum, a) => sum + a.balance, 0);
      const averageCostPerMile = calcWeightedAverageCost(programAccounts);

      const programSales = filteredSales.filter((s) => s.program === program.name);
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

  const ownerNames = useMemo(() => ["todos", ...owners.map((o) => o.name)], [owners]);
  const programNames = useMemo(() => ["todos", ...programs.map((p) => p.name)], [programs]);

  const filteredOwnerReports = useMemo(() => {
    if (selectedOwner === "todos") return ownerReports;
    return ownerReports.filter((r) => r.ownerName === selectedOwner);
  }, [ownerReports, selectedOwner]);

  const filteredProgramReports = useMemo(() => {
    if (selectedProgram === "todos") return programReports;
    return programReports.filter((r) => r.program === selectedProgram);
  }, [programReports, selectedProgram]);

  const periods = PERIOD_OPTIONS;

  const exportOwnerReport = () => {
    const data = filteredOwnerReports.map((r) => ({
      Dono: r.ownerName,
      "Pontos Adquiridos": r.totalPointsAcquired,
      Investimento: r.totalAmountInvested,
      "Milhas Geradas": r.totalMilesGenerated,
      Faturamento: r.totalRevenue,
      Lucro: r.totalProfit,
      Margem: `${r.profitMargin.toFixed(1)}%`,
      ROI: `${r.roi.toFixed(1)}%`,
    }));
    downloadCSV(data, `relatorio-donos-${selectedPeriod}-dias.csv`);
    toast.success(`relatorio-donos-${selectedPeriod}-dias.csv baixado com sucesso`);
  };

  const exportProgramReport = () => {
    const data = filteredProgramReports.map((r) => ({
      Programa: r.program,
      "Estoque Atual": r.totalStock,
      "Custo Médio/Milha": r.averageCostPerMile.toFixed(4),
      "Milhas Vendidas": r.totalSold,
      Faturamento: r.revenue,
      Lucro: r.profit,
    }));
    downloadCSV(data, `relatorio-programas-${selectedPeriod}-dias.csv`);
    toast.success(`relatorio-programas-${selectedPeriod}-dias.csv baixado com sucesso`);
  };

  const metrics = useMemo(
    () => ({
      totalInvested: filteredOwnerReports.reduce((sum, r) => sum + r.totalAmountInvested, 0),
      totalRevenue: filteredOwnerReports.reduce((sum, r) => sum + r.totalRevenue, 0),
      totalProfit: filteredOwnerReports.reduce((sum, r) => sum + r.totalProfit, 0),
      totalStock: filteredProgramReports.reduce((sum, r) => sum + r.totalStock, 0),
    }),
    [filteredOwnerReports, filteredProgramReports],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="space-y-2 mb-6">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
          <div className="h-24 bg-muted rounded-xl animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-display">
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground">
            Análise completa de performance e rentabilidade por dono
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportOwnerReport}
            className="gap-2 flex-1 sm:flex-none min-h-[44px]"
          >
            <Download className="h-4 w-4" />
            Exportar Donos
          </Button>
          <Button
            variant="outline"
            onClick={exportProgramReport}
            className="gap-2 flex-1 sm:flex-none min-h-[44px]"
          >
            <Download className="h-4 w-4" />
            Exportar Programas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card animate-appear animate-delay-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300">
        <Card className="shadow-card animate-appear animate-delay-300 border-t-2 border-t-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {metrics.totalInvested.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card animate-appear animate-delay-400 border-t-2 border-t-teal/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {metrics.totalRevenue.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card animate-appear animate-delay-500 border-t-2 border-t-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {metrics.totalProfit.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card animate-appear animate-delay-600 border-t-2 border-t-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.totalStock.toLocaleString("pt-BR")} milhas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Owner Performance Report */}
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 border-l-4 border-primary pl-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance por Dono
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Dono</TableHead>
                  <TableHead className="hidden md:table-cell">Pontos Adquiridos</TableHead>
                  <TableHead className="hidden md:table-cell">Investimento</TableHead>
                  <TableHead className="hidden md:table-cell">Milhas Geradas</TableHead>
                  <TableHead className="hidden md:table-cell">Faturamento</TableHead>
                  <TableHead className="hidden md:table-cell">Lucro</TableHead>
                  <TableHead className="hidden md:table-cell">Margem</TableHead>
                  <TableHead className="hidden md:table-cell">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOwnerReports.map((report) => (
                  <TableRow key={report.ownerName}>
                    <TableCell className="hidden md:table-cell font-medium">
                      {report.ownerName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {report.totalPointsAcquired.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      R$ {report.totalAmountInvested.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {report.totalMilesGenerated.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      R$ {report.totalRevenue.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-semibold text-success">
                      R$ {report.totalProfit.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{report.profitMargin.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={report.roi >= 20 ? "default" : "secondary"}>
                        {report.roi.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list - Owner Performance */}
          <div className="md:hidden space-y-3 mt-4">
            {filteredOwnerReports.map((report) => (
              <div key={report.ownerName} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base">{report.ownerName}</p>
                  <Badge variant={report.roi >= 20 ? "default" : "secondary"}>
                    ROI {report.roi.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Pontos Adquiridos:</span>
                    <p className="font-semibold">
                      {report.totalPointsAcquired.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Investimento:</span>
                    <p className="font-semibold">
                      R$ {report.totalAmountInvested.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Milhas Geradas:</span>
                    <p className="font-semibold">
                      {report.totalMilesGenerated.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Faturamento:</span>
                    <p className="font-semibold">
                      R$ {report.totalRevenue.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Lucro:</span>
                    <p className="font-semibold text-success">
                      R$ {report.totalProfit.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Margem:</span>
                    <p className="font-semibold">{report.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredOwnerReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório encontrado para os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Program Performance Report */}
      <Card className="shadow-card animate-appear animate-delay-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 border-l-4 border-primary pl-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Programa</TableHead>
                  <TableHead className="hidden md:table-cell">Estoque Atual</TableHead>
                  <TableHead className="hidden md:table-cell">Custo Médio/Milha</TableHead>
                  <TableHead className="hidden md:table-cell">Milhas Vendidas</TableHead>
                  <TableHead className="hidden md:table-cell">Faturamento</TableHead>
                  <TableHead className="hidden md:table-cell">Lucro</TableHead>
                  <TableHead className="hidden md:table-cell">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProgramReports.map((report) => {
                  const stockUtilization =
                    (report.totalSold / (report.totalStock + report.totalSold)) * 100;
                  return (
                    <TableRow key={report.program}>
                      <TableCell className="hidden md:table-cell font-medium">
                        {report.program}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {report.totalStock.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {report.averageCostPerMile.toFixed(4)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {report.totalSold.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {report.revenue.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-semibold text-success">
                        R$ {report.profit.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={stockUtilization >= 50 ? "default" : "outline"}>
                          {stockUtilization.toFixed(1)}% vendido
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list - Program Performance */}
          <div className="md:hidden space-y-3 mt-4">
            {filteredProgramReports.map((report) => {
              const stockUtilization =
                (report.totalSold / (report.totalStock + report.totalSold)) * 100;
              return (
                <div key={report.program} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-base">{report.program}</p>
                    <Badge variant={stockUtilization >= 50 ? "default" : "outline"}>
                      {stockUtilization.toFixed(1)}% vendido
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Estoque Atual:</span>
                      <p className="font-semibold">{report.totalStock.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Custo Médio/Milha:</span>
                      <p className="font-semibold">R$ {report.averageCostPerMile.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Milhas Vendidas:</span>
                      <p className="font-semibold">{report.totalSold.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Faturamento:</span>
                      <p className="font-semibold">R$ {report.revenue.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Lucro:</span>
                      <p className="font-semibold text-success">
                        R$ {report.profit.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProgramReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório encontrado para os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="shadow-card animate-appear animate-delay-1000">
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-success-light rounded-lg">
              <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-success" /> Melhor Performance
              </h4>
              <p className="text-sm">
                {[...ownerReports].sort((a, b) => b.roi - a.roi)[0]?.ownerName} apresenta o melhor
                ROI ({[...ownerReports].sort((a, b) => b.roi - a.roi)[0]?.roi.toFixed(1)}%)
              </p>
            </div>

            <div className="p-4 bg-warning-light rounded-lg">
              <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" /> Atenção
              </h4>
              <p className="text-sm">
                Programa {[...programReports].sort((a, b) => a.profit - b.profit)[0]?.program}
                com menor lucratividade. Considere revisar estratégia de preços.
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" /> Oportunidades
              </h4>
              <p className="text-sm">
                Estoque total de {metrics.totalStock.toLocaleString("pt-BR")} milhas disponível.
                Considere campanhas promocionais para acelerar vendas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
