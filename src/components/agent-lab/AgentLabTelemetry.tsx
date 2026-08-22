import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentLabMetricCard } from "./AgentLabMetricCard";
import type { AgentLabExperiment } from "@/lib/agentLabData";

export function AgentLabTelemetry({ experiment }: { experiment: AgentLabExperiment | null }) {
  const avgDuration = experiment?.results.length
    ? Math.round(
        experiment.results.reduce((sum, item) => sum + (item.duration ?? 0), 0) /
          experiment.results.length,
      )
    : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AgentLabMetricCard label="Executions" value={experiment ? 1 : 0} icon={<BarChart3 />} />
        <AgentLabMetricCard
          label="Mutations"
          value={experiment?.mutationsTotal ?? 0}
          icon={<BarChart3 />}
        />
        <AgentLabMetricCard label="Avg duration" value={`${avgDuration}ms`} icon={<BarChart3 />} />
        <AgentLabMetricCard
          label="FPR"
          value={experiment ? `${experiment.fpr.toFixed(1)}%` : "—"}
          icon={<BarChart3 />}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Telemetry Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Dados carregados do último relatório P12.6 versionado. Charts ricos ficam para a próxima
            iteração.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
