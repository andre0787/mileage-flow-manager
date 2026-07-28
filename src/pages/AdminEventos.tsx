import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface LogEntry {
  timestamp: string;
  userId?: string;
  type: "error" | "destructive_op" | "info" | "warn";
  context: string;
  details?: Record<string, unknown>;
  error?: string;
}

const TYPE_COLORS: Record<string, "destructive" | "warning" | "info" | "success"> = {
  error: "destructive",
  destructive_op: "warning",
  info: "info",
  warn: "warning",
};

const TYPE_LABELS: Record<string, string> = {
  error: "Erro",
  destructive_op: "Destrutiva",
  info: "Info",
  warn: "Aviso",
};

export default function AdminEventos() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("mc_debug_logs") || "[]");
      setLogs(stored.reverse()); // mais recentes primeiro
    } catch {
      setLogs([]);
    }
  }, []);

  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  const stats = {
    total: logs.length,
    error: logs.filter((l) => l.type === "error").length,
    destructive_op: logs.filter((l) => l.type === "destructive_op").length,
    info: logs.filter((l) => l.type === "info").length,
    warn: logs.filter((l) => l.type === "warn").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">📊 Observabilidade</h1>
        <button
          onClick={() => {
            localStorage.removeItem("mc_debug_logs");
            setLogs([]);
          }}
          className="rounded bg-destructive px-3 py-1 text-sm text-destructive-foreground hover:bg-destructive/90"
        >
          Limpar logs
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.error}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">Destrutivas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.destructive_op}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-500">Avisos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-500">{stats.warn}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {["all", "error", "destructive_op", "info", "warn"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              filter === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t === "all" ? "Todos" : TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            Nenhum evento registrado. Ative <code>VITE_ENABLE_DEBUG_LOG=true</code> no .env para
            começar.
          </p>
        )}
        {filtered.map((log, i) => (
          <Card key={i} className="border-l-4 border-l-transparent hover:border-l-primary/50">
            <CardContent className="flex items-start gap-3 py-3">
              <div className="shrink-0">
                <StatusBadge
                  status={
                    log.type === "destructive_op"
                      ? "pendente"
                      : log.type === "error"
                        ? "cancelado"
                        : "concluido"
                  }
                  showLabel
                  size="sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium">{log.context}</p>
                {log.error && <p className="mt-1 text-xs text-destructive">{log.error}</p>}
                {log.details && (
                  <pre className="mt-1 overflow-x-auto text-xs text-muted-foreground">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString("pt-BR")}
              </time>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
