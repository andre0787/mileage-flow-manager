import { Activity, AlertTriangle, Bug, CheckCircle2, Clock, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentLabMetricCard } from "./AgentLabMetricCard";
import {
  formatExperimentDate,
  getReadinessGrade,
  type AgentLabExperiment,
} from "@/lib/agentLabData";

export function AgentLabOverview({ experiment }: { experiment: AgentLabExperiment | null }) {
  const grade = getReadinessGrade(experiment);
  const total = experiment?.mutationsTotal ?? 0;
  const detected = experiment?.detected ?? 0;
  const recall = experiment ? `${experiment.recall.toFixed(1)}%` : "—";
  const precision = experiment ? `${experiment.precision.toFixed(1)}%` : "—";
  const fnr = experiment ? `${experiment.fnr.toFixed(1)}%` : "—";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" /> Agent QA Lab — P12.6
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">{grade.grade}</div>
              <Badge variant={grade.status === "PRODUCTION READY" ? "default" : "secondary"}>
                {grade.status}
              </Badge>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Detection recall" value={recall} />
              <Row label="Precision" value={precision} />
              <Row label="Score" value={experiment ? `${grade.score}%` : "—"} />
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Detected" value={`${detected}/${total}`} />
              <Row label="FNR" value={fnr} />
              <Row label="Last experiment" value={formatExperimentDate(experiment?.timestamp)} />
            </div>
          </div>
          {experiment?.validationNote && (
            <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {experiment.validationNote}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <AgentLabMetricCard
          label="Experiments"
          value={experiment ? 1 : 0}
          icon={<FlaskConical />}
        />
        <AgentLabMetricCard label="Detected" value={detected} icon={<CheckCircle2 />} />
        <AgentLabMetricCard label="Recall" value={recall} icon={<Bug />} />
        <AgentLabMetricCard label="Precision" value={precision} icon={<Activity />} />
        <AgentLabMetricCard label="Mode" value={experiment?.mode ?? "—"} icon={<Clock />} />
        <AgentLabMetricCard
          label="Detection"
          value={experiment?.detectionMode ?? "legacy"}
          icon={<Activity />}
        />
        <AgentLabMetricCard
          label="Missed"
          value={experiment?.missed ?? 0}
          icon={<AlertTriangle />}
        />
        <AgentLabMetricCard
          label="Skipped"
          value={experiment?.skipped ?? 0}
          icon={<AlertTriangle />}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
