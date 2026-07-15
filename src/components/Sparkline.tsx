import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

/**
 * Mini area chart sem eixos/grid/tooltip — embutido em MetricCards.
 * Usa Recharts (já instalado) com mínimo de overhead.
 */
export function Sparkline({
  data,
  color = "hsl(var(--primary))",
  className,
}: SparklineProps) {
  const chartData = useMemo(
    () => data.map((value, index) => ({ index, value })),
    [data],
  );

  if (data.length < 2) return null;

  return (
    <div
      className={cn("absolute bottom-0 left-0 right-0 h-10 opacity-30 pointer-events-none", className)}
      aria-hidden="true"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
