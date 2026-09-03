interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  description?: string;
}

export default function KPICard({ label, value, delta, description }: KPICardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-foreground font-display tabular-nums tracking-tight">
          {value}
        </span>
        {delta !== null && delta !== undefined && (
          <span
            className={`inline-flex items-center text-sm font-medium ${
              delta >= 0 ? "text-success" : "text-destructive"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
    </div>
  );
}
