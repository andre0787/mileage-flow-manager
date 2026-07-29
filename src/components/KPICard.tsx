interface KPICardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  description?: string;
}

export default function KPICard({ label, value, delta, description }: KPICardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold font-display">{value}</span>
        {delta !== null && delta !== undefined && (
          <span
            className={`inline-flex items-center text-sm font-medium ${
              delta >= 0 ? "text-green-500" : "text-red-500"
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
