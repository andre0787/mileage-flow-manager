import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramOwnerUsage } from "@/hooks/useClientCycleAvailability";

export function ControleCpfCriticalAlert({ entries }: { entries: ProgramOwnerUsage[] }) {
  const critical = entries.filter((e) => e.limit !== null && e.used >= e.limit * 0.9);
  if (critical.length === 0) return null;

  return (
    <Card className="shadow-card border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Atenção: Programas em Situação Crítica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {critical.map((entry) => (
            <div
              key={`${entry.programName}|${entry.ownerName}`}
              className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg"
            >
              <div>
                <p className="font-semibold">
                  {entry.programName} · {entry.ownerName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entry.used} de {entry.limit} passageiros utilizados
                </p>
              </div>
              <Badge variant="destructive">Crítico</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
