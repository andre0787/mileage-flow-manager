import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPIChartProps<T> {
  title: string;
  data: T[];
  dataKey: string | string[];
  type: "bar" | "line";
  unit?: string;
  labels?: string[];
}

const COLORS = ["hsl(var(--primary))", "hsl(173 80% 40%)", "hsl(43 96% 46%)", "hsl(0 73% 52%)"];

function getNestedValue(obj: Record<string, unknown>, path: string): number {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return 0;
    }
  }
  return typeof current === "number" ? current : 0;
}

export default function KPIChart<T extends Record<string, unknown>>({
  title,
  data,
  dataKey,
  type,
  unit,
  labels,
}: KPIChartProps<T>) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const chartLabels = labels ?? keys;

  const chartData = data.map((item) => {
    const row: Record<string, unknown> = { ...item };
    for (const key of keys) {
      if (key.includes(".")) {
        row[key] = getNestedValue(item, key);
      }
    }
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} unit={unit} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                {keys.length > 1 && <Legend />}
                {keys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLORS[i % COLORS.length]}
                    name={chartLabels[i] ?? key}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} unit={unit} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                {keys.length > 1 && <Legend />}
                {keys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[i % COLORS.length]}
                    name={chartLabels[i] ?? key}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
