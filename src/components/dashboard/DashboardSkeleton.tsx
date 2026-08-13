import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-12 w-72 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-6 space-y-4">
          <SkeletonTable rows={4} cols={3} />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    </div>
  );
}
