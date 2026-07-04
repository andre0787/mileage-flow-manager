import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { useClientCycleAvailability } from "@/hooks/useClientCycleAvailability";

export default function ControleCPF() {
  const { sales, programs } = useData();
  const { usage, programs: programNames, owners } = useClientCycleAvailability(sales, programs);

  const [selectedProgram, setSelectedProgram] = useState("todos");
  const [selectedOwner, setSelectedOwner] = useState("todos");

  const filteredUsage = usage.filter(u => {
    const programMatch = selectedProgram === "todos" || u.programName === selectedProgram;
    const ownerMatch = selectedOwner === "todos" || u.ownerName === selectedOwner;
    return programMatch && ownerMatch;
  });

  const programConfigs = new Map(programs.map(p => [p.name, p]));
  const usageByProgram = new Map<string, { limit: number | null; used: Set<string> }>();
  for (const u of usage) {
    const prev = usageByProgram.get(u.programName) || { limit: null, used: new Set<string>() };
    const program = programConfigs.get(u.programName);
    const limit = program?.maxPassengers ?? null;
    for (const c of u.clients) prev.used.add(c.clientId);
    usageByProgram.set(u.programName, { limit, used: prev.used });
  }

  const programsAlert = Array.from(usageByProgram.entries())
    .filter(([_, info]) => info.limit !== null && info.used.size >= info.limit! * 0.8)
    .length;

  const programsCritical = Array.from(usageByProgram.entries())
    .filter(([_, info]) => info.limit !== null && info.used.size >= info.limit! * 0.9)
    .length;

  const totalUniqueClients = new Set(usage.flatMap(u => u.clients.map(c => c.clientId))).size;

  const hasLimit = (limit: number | null): limit is number => limit !== null;

  const getStatusColor = (used: number, limit: number | null) => {
    if (!hasLimit(limit)) return "default" as const;
    const pct = (used / limit) * 100;
    if (pct >= 90) return "destructive" as const;
    if (pct >= 80) return "secondary" as const;
    return "default" as const;
  };

  const getAlertLevel = (used: number, limit: number | null) => {
    if (!hasLimit(limit)) return "Sem limite";
    const pct = (used / limit) * 100;
    if (pct >= 90) return "Crítico";
    if (pct >= 80) return "Atenção";
    return "Normal";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Controle de Clientes por Programa</h1>
          <p className="text-sm text-muted-foreground">
            Monitore a disponibilidade de clientes por ciclo, programa e dono
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Programa:</label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Programas</SelectItem>
              {programNames.map((program) => (
                <SelectItem key={program} value={program}>{program}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Dono:</label>
          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Donos</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner} value={owner}>{owner}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalUniqueClients}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programas em Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{programsAlert}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Situação Crítica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{programsCritical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Program Usage Cards */}
      {usageByProgram.size > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from(usageByProgram.entries()).map(([programName, info]) => {
            const percentage = hasLimit(info.limit) ? (info.used.size / info.limit) * 100 : 0;
            const cycleInfo = usage.find(u => u.programName === programName);

            return (
              <Card key={programName} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{programName}</CardTitle>
                    {hasLimit(info.limit) ? (
                      percentage >= 90 ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
                      percentage >= 80 ? <Shield className="h-4 w-4 text-warning" /> :
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cycleInfo?.cycleLabel || "Sem ciclo definido"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 animate-slide-up">
                  {hasLimit(info.limit) ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uso atual:</span>
                        <span className="font-semibold">{info.used.size}/{info.limit} clientes</span>
                      </div>
                      <Progress
                        value={percentage}
                        className="h-2 transition-all duration-1000"
                        style={{
                          ['--progress-color' as string]: percentage >= 90
                            ? 'hsl(var(--destructive))'
                            : percentage >= 80
                              ? 'hsl(var(--warning))'
                              : 'hsl(var(--primary))'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span>Uso atual:</span>
                      <span className="font-semibold">{info.used.size} clientes</span>
                    </div>
                  )}

                  <Badge
                    variant={getStatusColor(info.used.size, info.limit)}
                    className="w-full justify-center"
                  >
                    {getAlertLevel(info.used.size, info.limit)}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Detalhamento por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsage.length > 0 ? (
            <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Dono</TableHead>
                  <TableHead className="hidden md:table-cell">Programa</TableHead>
                  <TableHead className="hidden md:table-cell">Ciclo</TableHead>
                  <TableHead className="hidden md:table-cell">Último Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsage.flatMap(u =>
                  u.clients.map(c => ({ ...c, programName: u.programName, ownerName: u.ownerName, cycleLabel: u.cycleLabel }))
                ).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="hidden md:table-cell font-medium">{row.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">{row.cpf}</TableCell>
                    <TableCell className="hidden md:table-cell">{row.ownerName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{row.programName}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.cycleLabel}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(row.lastSaleDate).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {/* Mobile card list - Detalhamento */}
            <div className="md:hidden space-y-3 mt-4">
              {filteredUsage.flatMap(u =>
                u.clients.map(c => ({ ...c, programName: u.programName, ownerName: u.ownerName, cycleLabel: u.cycleLabel }))
              ).map((row, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.cpf}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">{row.programName}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Dono</span>
                      <p className="truncate">{row.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Ciclo</span>
                      <p className="truncate">{row.cycleLabel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Último Uso</span>
                      <p>{new Date(row.lastSaleDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum registro encontrado para os filtros selecionados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Messages */}
      {Array.from(usageByProgram.entries()).some(
        ([_, info]) => hasLimit(info.limit) && info.used.size >= info.limit! * 0.9
      ) && (
        <Card className="shadow-card border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Programas em Situação Crítica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(usageByProgram.entries())
                .filter(([_, info]) => hasLimit(info.limit) && info.used.size >= info.limit! * 0.9)
                .map(([programName, info]) => (
                  <div key={programName} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-semibold">{programName}</p>
                      <p className="text-sm text-muted-foreground">
                        {info.used.size} de {info.limit} clientes utilizados
                      </p>
                    </div>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
