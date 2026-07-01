import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { PieChartIcon, BarChart3 } from "lucide-react"

interface ProgramData {
  name: string
  value: number
  color: string
}

interface MonthlyData {
  month: string
  vendas: number
  lucro: number
}

interface DashboardChartsProps {
  programData: ProgramData[]
  monthlySales: MonthlyData[]
  unitLabel?: string
  hideBarChart?: boolean
}

const COLORS = [
  "hsl(230 65% 50%)",
  "hsl(152 65% 35%)",
  "hsl(42 85% 52%)",
  "hsl(175 70% 38%)",
  "hsl(271 81% 56%)",
  "hsl(0 72% 51%)",
];

export function DashboardCharts({ programData, monthlySales, unitLabel = "Milhas", hideBarChart = false }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
            <PieChartIcon className="h-4 w-4 text-primary" />
            {unitLabel} por Programa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {programData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString('pt-BR')}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {programData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground font-body">{entry.name}</span>
                </div>
                <span className="font-mono text-sm font-medium">{entry.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!hideBarChart && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold font-display">
              <BarChart3 className="h-4 w-4 text-primary" />
              Vendas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="hsl(230 65% 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" fill="hsl(152 65% 35%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
