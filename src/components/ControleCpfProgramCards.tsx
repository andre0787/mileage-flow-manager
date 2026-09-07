import { AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProgramOwnerUsage } from "@/hooks/useClientCycleAvailability";

const hasLimit = (limit: number | null): limit is number => limit !== null;

function getStatusColor(used: number, limit: number | null) {
  if (!hasLimit(limit)) return "default" as const;
  const pct = (used / limit) * 100;
  if (pct >= 90) return "destructive" as const;
  if (pct >= 80) return "secondary" as const;
  return "default" as const;
}

function getAlertLevel(used: number, limit: number | null) {
  if (!hasLimit(limit)) return "Sem limite";
  const pct = (used / limit) * 100;
  if (pct >= 90) return "Crítico";
  if (pct >= 80) return "Atenção";
  return "Normal";
}

function StatusIcon({ used, limit }: { used: number; limit: number | null }) {
  if (!hasLimit(limit)) return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
  const pct = (used / limit) * 100;
  if (pct >= 90) return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (pct >= 80) return <Shield className="h-4 w-4 text-warning" />;
  return <CheckCircle className="h-4 w-4 text-primary" />;
}

export function ControleCpfProgramCards({ entries }: { entries: ProgramOwnerUsage[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 animate-appear animate-delay-600">
      {entries.map((entry) => (
        <Card key={`${entry.programName}|${entry.ownerName}`} className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{entry.programName}</CardTitle>
              <StatusIcon used={entry.used} limit={entry.limit} />
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.ownerName} · {entry.cycleLabel || "Sem ciclo definido"}
            </p>
          </CardHeader>

          <CardContent className="space-y-3 animate-slide-up">
            {hasLimit(entry.limit) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uso atual:</span>
                  <span className="font-semibold">
                    {entry.used}/{entry.limit} passageiros
                  </span>
                </div>
                <Progress
                  value={entry.percentage}
                  className="h-2 transition-all duration-1000"
                  style={{
                    ["--progress-color" as string]:
                      entry.percentage >= 90
                        ? "hsl(var(--destructive))"
                        : entry.percentage >= 80
                          ? "hsl(var(--warning))"
                          : "hsl(var(--primary))",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span>Uso atual:</span>
                <span className="font-semibold">{entry.used} passageiros</span>
              </div>
            )}

            <Badge
              variant={getStatusColor(entry.used, entry.limit)}
              className="w-full justify-center"
            >
              {getAlertLevel(entry.used, entry.limit)}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
