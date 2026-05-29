import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CPFUsage {
  cpf: string;
  clientName: string;
  program: string;
  usageCount: number;
  lastUsed: string;
  year: number;
}

interface ProgramLimit {
  program: string;
  maxCPFs: number;
  currentCount: number;
  resetType: "rolling" | "annual";
  description: string;
}

export default function ControleCPF() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedProgram, setSelectedProgram] = useState("todos");

  const programLimits: ProgramLimit[] = [
    {
      program: "LATAM Pass",
      maxCPFs: 22,
      currentCount: 18,
      resetType: "rolling",
      description: "Últimos 12 meses (rolling window)"
    },
    {
      program: "Smiles",
      maxCPFs: 22,
      currentCount: 15,
      resetType: "annual",
      description: "Ano civil (zera em janeiro)"
    },
    {
      program: "Livelo",
      maxCPFs: 22,
      currentCount: 12,
      resetType: "annual",
      description: "Ano civil (zera em janeiro)"
    },
    {
      program: "Esfera",
      maxCPFs: 22,
      currentCount: 8,
      resetType: "annual",
      description: "Ano civil (zera em janeiro)"
    }
  ];

  const cpfUsages: CPFUsage[] = [
    { cpf: "123.456.789-00", clientName: "João Silva", program: "LATAM Pass", usageCount: 3, lastUsed: "2024-01-15", year: 2024 },
    { cpf: "987.654.321-00", clientName: "Maria Santos", program: "LATAM Pass", usageCount: 4, lastUsed: "2024-01-20", year: 2024 },
    { cpf: "456.789.123-00", clientName: "Pedro Costa", program: "LATAM Pass", usageCount: 2, lastUsed: "2024-01-18", year: 2024 },
    { cpf: "789.123.456-00", clientName: "Ana Oliveira", program: "Smiles", usageCount: 2, lastUsed: "2024-01-22", year: 2024 },
    { cpf: "321.654.987-00", clientName: "Carlos Mendes", program: "Smiles", usageCount: 1, lastUsed: "2024-01-25", year: 2024 },
    { cpf: "654.987.321-00", clientName: "Lucia Ferreira", program: "Livelo", usageCount: 3, lastUsed: "2024-01-28", year: 2024 },
    { cpf: "147.258.369-00", clientName: "Roberto Silva", program: "Esfera", usageCount: 1, lastUsed: "2024-01-30", year: 2024 },
  ];

  const years = ["2023", "2024"];
  const programs = ["todos", ...programLimits.map(p => p.program)];

  const filteredUsages = cpfUsages.filter(usage => {
    const yearMatch = usage.year.toString() === selectedYear;
    const programMatch = selectedProgram === "todos" || usage.program === selectedProgram;
    return yearMatch && programMatch;
  });

  const getStatusColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "destructive";
    if (percentage >= 80) return "secondary";
    return "default";
  };

  const getStatusIcon = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= 80) return <Shield className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getAlertLevel = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "Crítico";
    if (percentage >= 80) return "Atenção";
    return "Normal";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de CPFs</h1>
          <p className="text-muted-foreground">
            Monitore o uso de CPFs por programa e evite bloqueios
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Ano:</label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Programa:</label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-48">
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
      </div>

      {/* Program Limits Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {programLimits.map((limit) => {
          const percentage = (limit.currentCount / limit.maxCPFs) * 100;
          return (
            <Card key={limit.program} className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{limit.program}</CardTitle>
                  {getStatusIcon(limit.currentCount, limit.maxCPFs)}
                </div>
                <p className="text-xs text-muted-foreground">{limit.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-3 animate-slide-up">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uso atual:</span>
                    <span className="font-semibold">
                      {limit.currentCount}/{limit.maxCPFs} CPFs
                    </span>
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
                
                <Badge 
                  variant={getStatusColor(limit.currentCount, limit.maxCPFs)}
                  className="w-full justify-center"
                >
                  {getAlertLevel(limit.currentCount, limit.maxCPFs)}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de CPFs Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Set(filteredUsages.map(u => u.cpf)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programas em Alerta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {programLimits.filter(p => (p.currentCount / p.maxCPFs) >= 0.8).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Situação Crítica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {programLimits.filter(p => (p.currentCount / p.maxCPFs) >= 0.9).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPF Usage Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Histórico de Uso por CPF ({selectedYear})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CPF</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Qtd. Usos</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsages.map((usage, index) => {
                const programLimit = programLimits.find(p => p.program === usage.program);
                const isFrequentUser = usage.usageCount >= 3;
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{usage.cpf}</TableCell>
                    <TableCell className="font-medium">{usage.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{usage.program}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isFrequentUser ? "secondary" : "outline"}>
                        {usage.usageCount}x
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(usage.lastUsed).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={isFrequentUser ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {isFrequentUser ? "Frequente" : "Normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredUsages.length === 0 && (
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
      {programLimits.some(p => (p.currentCount / p.maxCPFs) >= 0.9) && (
        <Card className="shadow-card border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Programas em Situação Crítica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {programLimits
                .filter(p => (p.currentCount / p.maxCPFs) >= 0.9)
                .map(program => (
                  <div key={program.program} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-semibold">{program.program}</p>
                      <p className="text-sm text-muted-foreground">
                        {program.currentCount} de {program.maxCPFs} CPFs utilizados
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