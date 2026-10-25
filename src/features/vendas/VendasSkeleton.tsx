import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";

export function VendasSkeleton() {
  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <SkeletonTable rows={4} cols={5} />
      </div>
    </div>
  );
}
