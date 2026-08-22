/**
 * P12.6-15/16/17/18/19/20/21 — Agent Lab Page
 *
 * Dashboard completo com 6 tabs:
 * - Overview: métricas gerais, grade, production readiness
 * - Mutations: tabela com status detalhado
 * - Experiments: histórico de execuções
 * - Evidence: visualizador de evidências
 * - Promotions: health das fontes
 * - Telemetry: métricas de telemetria com filtros
 */

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  Bug,
  FlaskConical,
  FileText,
  Flame,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ─── Mock data (will be replaced with real experiment data) ─────

interface MutationEntry {
  id: string;
  category: string;
  severity: string;
  detection: string;
  triage: string;
  fix: string;
  regression: string;
  status: "detected" | "missed" | "fixed" | "regression";
}

interface ExperimentEntry {
  id: string;
  type: string;
  model: string;
  strategy: string;
  started: string;
  duration: string;
  tokens: number;
  cost: number;
  quality: number;
  status: "completed" | "running" | "failed";
}

interface TelemetryMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  icon: React.ReactNode;
}

// ─── Grade Calculator ──────────────────────────────────────────

function calculateGrade(metrics: {
  recall: number;
  precision: number;
  evidence: number;
  fixSuccess: number;
  regression: number;
}): { grade: string; status: string } {
  const avg =
    (metrics.recall +
      metrics.precision +
      metrics.evidence +
      metrics.fixSuccess +
      (100 - metrics.regression)) /
    5;

  if (avg >= 95) return { grade: "A", status: "PRODUCTION READY" };
  if (avg >= 85) return { grade: "B", status: "CONDITIONAL" };
  if (avg >= 70) return { grade: "C", status: "NEEDS IMPROVEMENT" };
  if (avg >= 50) return { grade: "D", status: "NOT READY" };
  return { grade: "F", status: "BLOCKED" };
}

// ─── Overview Tab ──────────────────────────────────────────────

function OverviewTab() {
  const grade = calculateGrade({
    recall: 0,
    precision: 0,
    evidence: 0,
    fixSuccess: 0,
    regression: 0,
  });

  const metrics: TelemetryMetric[] = [
    { label: "Total Experiments", value: 0, icon: <FlaskConical className="w-4 h-4" /> },
    { label: "Success Rate", value: "0%", icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: "Detection Recall", value: "0%", trend: "flat", icon: <Bug className="w-4 h-4" /> },
    { label: "Precision", value: "0%", trend: "flat", icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: "Total Cost", value: "$0.00", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "Total Tokens", value: "0", icon: <Activity className="w-4 h-4" /> },
    { label: "Avg Latency", value: "0ms", icon: <Clock className="w-4 h-4" /> },
    { label: "Regression Rate", value: "0%", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Grade Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Agent QA Lab — P12.6
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">{grade.grade}</div>
              <Badge
                variant={grade.status === "PRODUCTION READY" ? "default" : "secondary"}
                className="mt-2"
              >
                {grade.status}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Detection Recall</span>
                <span className="font-mono text-sm">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Precision</span>
                <span className="font-mono text-sm">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Evidence Quality</span>
                <span className="font-mono text-sm">—</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Fix Success</span>
                <span className="font-mono text-sm">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Regression</span>
                <span className="font-mono text-sm">—</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Experiment</span>
                <span className="font-mono text-sm">Never</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {m.icon}
                <span className="text-xs font-medium">{m.label}</span>
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
              {m.trend && (
                <div className="flex items-center gap-1 mt-1">
                  {m.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
                  {m.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
                  <span
                    className={`text-xs ${m.trend === "up" ? "text-green-500" : m.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "—"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Mutations Tab ─────────────────────────────────────────────

function MutationsTab() {
  const [selectedMutation, setSelectedMutation] = useState<string | null>(null);

  const mutations: MutationEntry[] = [
    {
      id: "M01",
      category: "ui",
      severity: "medium",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M02",
      category: "api",
      severity: "high",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M03",
      category: "data",
      severity: "critical",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M04",
      category: "validation",
      severity: "high",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M05",
      category: "state",
      severity: "medium",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M06",
      category: "workflow",
      severity: "high",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M07",
      category: "authorization",
      severity: "critical",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M08",
      category: "ui",
      severity: "low",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M09",
      category: "api",
      severity: "medium",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
    {
      id: "M10",
      category: "data",
      severity: "high",
      detection: "—",
      triage: "—",
      fix: "—",
      regression: "—",
      status: "missed",
    },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case "detected":
        return "bg-green-500/10 text-green-700";
      case "fixed":
        return "bg-blue-500/10 text-blue-700";
      case "regression":
        return "bg-red-500/10 text-red-700";
      case "missed":
        return "bg-yellow-500/10 text-yellow-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Mutation Catalog — 10 Mutations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Detection</TableHead>
                <TableHead>Triage</TableHead>
                <TableHead>Fix</TableHead>
                <TableHead>Regression</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mutations.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMutation(selectedMutation === m.id ? null : m.id)}
                >
                  <TableCell className="font-mono font-bold">{m.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.severity === "critical"
                          ? "destructive"
                          : m.severity === "high"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {m.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{m.detection}</TableCell>
                  <TableCell className="font-mono text-sm">{m.triage}</TableCell>
                  <TableCell className="font-mono text-sm">{m.fix}</TableCell>
                  <TableCell className="font-mono text-sm">{m.regression}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(m.status)}`}
                    >
                      {m.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mutation Detail */}
      {selectedMutation && (
        <Card>
          <CardHeader>
            <CardTitle>Mutation Detail — {selectedMutation}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Baseline:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mutated:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Detection:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Triage:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Root Cause:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fix:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Regression:</span>{" "}
                <span className="font-mono">—</span>
              </div>
              <div>
                <span className="text-muted-foreground">Evidence:</span>{" "}
                <span className="font-mono">—</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Experiments Tab ───────────────────────────────────────────

function ExperimentsTab() {
  const experiments: ExperimentEntry[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5" />
          Experiment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {experiments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No experiments run yet.</p>
            <p className="text-sm mt-1">
              Run <code className="bg-muted px-1 rounded">npm run p12.6:experiment</code> to start.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono">{e.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{e.model}</TableCell>
                  <TableCell className="text-sm">{e.strategy}</TableCell>
                  <TableCell className="text-sm">{e.started}</TableCell>
                  <TableCell className="font-mono text-sm">{e.duration}</TableCell>
                  <TableCell className="font-mono text-sm">{e.tokens.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-sm">${e.cost.toFixed(4)}</TableCell>
                  <TableCell className="font-mono text-sm">{e.quality}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        e.status === "completed"
                          ? "default"
                          : e.status === "running"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Evidence Tab ──────────────────────────────────────────────

function EvidenceTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Evidence Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No evidence collected yet.</p>
          <p className="text-sm mt-1">Evidence will appear after running experiments.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Promotions Tab ────────────────────────────────────────────

function PromotionsTab() {
  const sources = [
    {
      name: "Livelo",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
    {
      name: "Smiles",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
    {
      name: "LATAM Pass",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
    {
      name: "Azul Fidelidade",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
    {
      name: "Esfera",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
    {
      name: "Passageiro de Primeira",
      health: "healthy",
      lastRun: "—",
      nextRun: "—",
      freshness: "—",
      reliability: "—",
      errors: 0,
    },
  ];

  const healthColor = (h: string) => {
    switch (h) {
      case "healthy":
        return "bg-green-500/10 text-green-700";
      case "degraded":
        return "bg-yellow-500/10 text-yellow-700";
      case "down":
        return "bg-red-500/10 text-red-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Sources</div>
            <div className="text-2xl font-bold">{sources.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Discovered</div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Validated</div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Alerts</div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Source Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Source Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${healthColor(s.health)}`}
                    >
                      {s.health}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.lastRun}</TableCell>
                  <TableCell className="font-mono text-sm">{s.nextRun}</TableCell>
                  <TableCell className="font-mono text-sm">{s.freshness}</TableCell>
                  <TableCell className="font-mono text-sm">{s.reliability}</TableCell>
                  <TableCell className="font-mono text-sm">{s.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Telemetry Tab ─────────────────────────────────────────────

function TelemetryTab() {
  return (
    <div className="space-y-4">
      {/* Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Executions</div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Tokens</div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Cost</div>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">Avg Latency</div>
            <div className="text-2xl font-bold">0ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Telemetry Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Charts will render after telemetry data is collected.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Tokens per Execution</div>
                <div className="font-mono mt-1">—</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Cost per Strategy</div>
                <div className="font-mono mt-1">—</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Latency per Agent</div>
                <div className="font-mono mt-1">—</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Quality vs Cost</div>
                <div className="font-mono mt-1">—</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Detection Recall</div>
                <div className="font-mono mt-1">—</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Regression Rate</div>
                <div className="font-mono mt-1">—</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function AgentLab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            Agent Lab
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            P12.6 — Agent QA Mutation Lab + Promotion Intelligence
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Environment: {import.meta.env.MODE || "development"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1">
            <Activity className="w-3 h-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="mutations" className="gap-1">
            <Bug className="w-3 h-3" /> Mutations
          </TabsTrigger>
          <TabsTrigger value="experiments" className="gap-1">
            <FlaskConical className="w-3 h-3" /> Experiments
          </TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1">
            <FileText className="w-3 h-3" /> Evidence
          </TabsTrigger>
          <TabsTrigger value="promotions" className="gap-1">
            <Flame className="w-3 h-3" /> Promotions
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="gap-1">
            <BarChart3 className="w-3 h-3" /> Telemetry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="mutations">
          <MutationsTab />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsTab />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceTab />
        </TabsContent>

        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>

        <TabsContent value="telemetry">
          <TelemetryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
