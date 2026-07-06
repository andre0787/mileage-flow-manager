import { cn } from "@/lib/utils";

interface AltitudeBarProps {
  value: number;
  goal?: number;
  className?: string;
  color?: string;
}

export function AltitudeBar({ value, goal, className, color }: AltitudeBarProps) {
  const pct = goal && goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className={cn("relative h-3 w-full rounded-full bg-muted/40 overflow-hidden", className)}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${pct}%`,
          background: color ?? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))",
        }}
      />
      {pct >= 100 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            META ATINGIDA 🎯
          </span>
        </div>
      )}
    </div>
  );
}
