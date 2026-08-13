import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { cn } from "@/lib/utils";

export interface HeroStatValue {
  /** Valor numérico exibido com AnimatedNumber */
  value: number;
  /** Prefixo exibido antes do valor (ex: "+", "R$ ") */
  prefix?: string;
  /** Formato do valor: raw (padrão) | fixed3 (custo/milha) | percent1 (margem) */
  format?: "raw" | "fixed3" | "percent1";
}

export interface HeroStatCardProps {
  icon: LucideIcon;
  label: string;
  value: HeroStatValue;
  iconColor: string;
  valueColor: string;
  borderClass?: string;
}

export function HeroStatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  valueColor,
  borderClass = "border-border/60",
}: HeroStatCardProps) {
  const formatted =
    value.format === "fixed3"
      ? value.value.toFixed(3)
      : value.format === "percent1"
        ? `${value.value.toFixed(1)}%`
        : undefined;

  return (
    <div
      className={cn(
        "p-2 sm:px-3 sm:py-2.5 rounded-xl glass transition-card duration-300 hover:shadow-md",
        borderClass,
      )}
    >
      <div className="flex items-center gap-1 text-xs text-muted-foreground tracking-wide font-medium mb-0.5">
        <Icon className={cn("w-3 h-3 shrink-0", iconColor)} />
        <span className="truncate">{label}</span>
      </div>
      <p className={cn("text-xs sm:text-sm font-bold tabular-nums", valueColor)}>
        {value.prefix && value.prefix}
        {formatted ?? <AnimatedNumber value={value.value} />}
      </p>
    </div>
  );
}
