import { useEffect, useRef, useState } from "react";
import { useWorkflowData } from "@/lib/workflowData";

function BarRow({ name, n, color, max }: { name: string; n: number; color: string; max: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const pct = max > 0 ? Math.round((n / max) * 100) : 0;
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className="w-36 shrink-0 truncate text-xs font-medium text-foreground">{name}</div>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: visible ? `${pct}%` : "0%", background: color }}
        />
      </div>
      <div className="w-8 shrink-0 text-right text-xs font-bold text-foreground">{n}</div>
    </div>
  );
}

function CounterStat({ value, label, sub }: { value: number; label: string; sub: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const start = performance.now();
          const dur = 1200;
          const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(value * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref} className="rounded-xl border bg-card p-4 text-center">
      <div className="font-display text-2xl font-extrabold text-primary md:text-3xl">
        {display.toLocaleString("pt-BR")}
      </div>
      <div className="mt-1 text-xs font-semibold text-foreground">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function TimelineRow({ t, d, desc }: { t: string; d: string; desc: string }) {
  const badge =
    d === "pre-pr"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : d === "rule:fail"
        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-36 shrink-0 font-mono text-xs text-muted-foreground">{t}</div>
      <div className="w-20 shrink-0">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badge}`}>{d}</span>
      </div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

export function WorkflowTelemetry() {
  const data = useWorkflowData();
  const { kpiStats, eventTypes, grades, recentTimeline, dataDate } = data;
  const maxEvents = Math.max(...eventTypes.map((e) => e.n), 1);
  const maxGrade = Math.max(...grades.map((g) => g.n), 1);

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        A telemetria
      </span>
      <h2 className="text-xl font-bold text-foreground font-display md:text-2xl">
        Números reais do sistema
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Tudo o que acontece vira um registro em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          docs/tracking/events.jsonl
        </code>{" "}
        e <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">quality.jsonl</code>.
        Dados reais do repositório em <b className="text-foreground">{dataDate}</b> (últimos 30
        dias):
      </p>

      <div className="grid grid-cols-2 gap-3">
        {kpiStats.map((s) => (
          <CounterStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">📊 Eventos por tipo</h3>
      <div className="space-y-2">
        {eventTypes.map((e) => (
          <BarRow key={e.name} name={e.name} n={e.n} color={e.color} max={maxEvents} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">
        🏆 Nota de qualidade (outcome grade)
      </h3>
      <div className="space-y-2">
        {grades.map((g) => (
          <BarRow key={g.name} name={g.name} n={g.n} color={g.color} max={maxGrade} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">
        🕒 Linha do tempo recente (eventos reais)
      </h3>
      <div className="divide-y divide-border rounded-xl border bg-card">
        {recentTimeline.map((e, i) => (
          <TimelineRow key={i} t={e.t} d={e.d} desc={e.desc} />
        ))}
      </div>
    </div>
  );
}
