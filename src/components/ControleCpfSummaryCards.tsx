import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControleCpfSummaryCardsProps {
  totalPassengers: number;
  programsAlert: number;
  programsCritical: number;
}

export function ControleCpfSummaryCards({
  totalPassengers,
  programsAlert,
  programsCritical,
}: ControleCpfSummaryCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300">
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Passageiros Únicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalPassengers}</div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Programas em Alerta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{programsAlert}</div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Situação Crítica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{programsCritical}</div>
        </CardContent>
      </Card>
    </div>
  );
}
