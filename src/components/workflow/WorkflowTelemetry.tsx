import { useEffect, useRef, useState } from "react";
import {
  EVENT_TYPES,
  GRADES,
  KPI_STATS,
  MAX_EVENTS,
  MAX_GRADE,
  RECENT_TIMELINE,
} from "@/lib/workflowDemoData";

/**
 * WorkflowTelemetry — "Números reais do sistema": stats, barras e linha do
 * tempo recente. Port da seção #telemetria do relatório ilustrativo.
 */
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

  const pct = Math.round((n / max) * 100);

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
      <div className="text-2xl md:text-3xl font-extrabold text-primary font-display">
        {display.toLocaleString("pt-BR")}
      </div>
      <div className="mt-1 text-xs font-semibold text-foreground">{label}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

export function WorkflowTelemetry() {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        A telemetria
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-foreground font-display">
        Números reais do sistema
      </h2>
      <p className="text-sm text-muted-foreground max-w-3xl">
        Tudo o que acontece vira um registro em{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
          docs/tracking/events.jsonl
        </code>{" "}
        e <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">quality.jsonl</code>.
        Estes são os dados <b className="text-foreground">reais</b> deste repositório:
      </p>

      <div className="grid grid-cols-2 gap-3">
        {KPI_STATS.map((s) => (
          <CounterStat key={s.label} value={s.value} label={s.label} sub={s.sub} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">📊 Eventos por tipo</h3>
      <div className="space-y-2">
        {EVENT_TYPES.map((e) => (
          <BarRow key={e.name} name={e.name} n={e.n} color={e.color} max={MAX_EVENTS} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">
        🏆 Nota de qualidade (outcome grade)
      </h3>
      <div className="space-y-2">
        {GRADES.map((g) => (
          <BarRow key={g.name} name={g.name} n={g.n} color={g.color} max={MAX_GRADE} />
        ))}
      </div>

      <h3 className="pt-4 text-[17px] font-bold text-foreground">
        🕒 Linha do tempo recente (eventos reais)
      </h3>
      <div className="rounded-xl border bg-card divide-y divide-border">
        {RECENT_TIMELINE.map((e, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <div className="w-36 shrink-0 text-xs font-mono text-muted-foreground">{e.t}</div>
            <div className="w-20 shrink-0">
              <span
                className={
                  e.d === "pre-pr"
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300"
                }
              >
                {e.d}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{e.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
