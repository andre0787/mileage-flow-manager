import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardChartsContent = lazy(() => import("./DashboardChartsContent"));

interface ProgramData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  vendas: number;
  lucro: number;
}

interface DashboardChartsProps {
  programData: ProgramData[];
  monthlySales: MonthlyData[];
  unitLabel?: string;
  hideBarChart?: boolean;
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    </div>
  );
}

export function DashboardCharts(props: DashboardChartsProps) {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <DashboardChartsContent {...props} />
    </Suspense>
  );
}
