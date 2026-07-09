import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

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
}

const variantStyles = {
  default: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  gold: {
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
  },
  teal: {
    iconBg: "bg-teal/10",
    iconColor: "text-teal",
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
      {/* Gradient accent bar at top */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          variant === "default" && "bg-gradient-to-r from-primary/60 to-primary-light/40",
          variant === "success" && "bg-gradient-to-r from-success/60 to-success/40",
          variant === "warning" && "bg-gradient-to-r from-warning/60 to-warning/40",
          variant === "gold" && "bg-gradient-to-r from-gold/60 to-gold/40",
          variant === "teal" && "bg-gradient-to-r from-teal/60 to-teal/40",
        )}
      />

      {/* Subtle background gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.06]",
          "bg-gradient-to-br from-transparent",
          variant === "default" && "to-primary",
          variant === "success" && "to-success",
          variant === "warning" && "to-warning",
          variant === "gold" && "to-gold",
          variant === "teal" && "to-teal",
        )}
      />

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase font-display">
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

        <div className="text-2xl font-bold text-foreground tracking-tight">
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
      </CardContent>
    </Card>
  );
}
