import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "gold" | "teal";
  prefix?: string;
  /** Dados numéricos mensais para sparkline (mínimo 2 pontos) */
  sparklineData?: number[];
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    sparklineColor: "hsl(var(--primary))",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
    sparklineColor: "hsl(var(--success))",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    sparklineColor: "hsl(var(--warning))",
  },
  gold: {
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
    sparklineColor: "hsl(var(--gold))",
  },
  teal: {
    iconBg: "bg-teal/10",
    iconColor: "text-teal",
    sparklineColor: "hsl(var(--teal))",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  prefix,
  sparklineData,
}: MetricCardProps) {
  const vs = variantStyles[variant];
  const numericValue = typeof value === "number" ? value : undefined;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-card duration-300 group",
        "hover:shadow-elegant hover:-translate-y-0.5",
      )}
    >
      {/* Solid accent bar at top (Apple-style, cor sólida sutil) */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[3px]",
          variant === "default" && "bg-primary",
          variant === "success" && "bg-success",
          variant === "warning" && "bg-warning",
          variant === "gold" && "bg-gold",
          variant === "teal" && "bg-teal",
        )}
      />

      <CardContent
        className={cn("p-5 relative", sparklineData && sparklineData.length >= 2 && "pb-12")}
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground font-display">
            {title}
          </span>
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              "backdrop-blur-sm transition-transform duration-300 group-hover:scale-110",
              vs.iconBg,
            )}
          >
            <Icon className={cn("w-4 h-4", vs.iconColor)} />
          </div>
        </div>

        <div className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
          {prefix && <span className="text-muted-foreground text-lg mr-0.5">{prefix}</span>}
          {numericValue !== undefined ? <AnimatedNumber value={numericValue} /> : value}
        </div>

        {subtitle && <p className="text-xs text-muted-foreground mt-1.5 font-body">{subtitle}</p>}

        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md transition-all duration-300",
                trend.isPositive
                  ? "text-success bg-success/10"
                  : "text-destructive bg-destructive/10",
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs. mês anterior</span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} color={vs.sparklineColor} />
        )}
      </CardContent>
    </Card>
  );
}
