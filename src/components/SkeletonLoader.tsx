import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  /** Número de linhas na tabela */
  rows?: number;
  /** Número de colunas na tabela */
  cols?: number;
  /** Classes adicionais */
  className?: string;
}

/** Placeholder para tabelas em loading */
export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonLoaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Placeholder para cards de métrica em loading */
export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Placeholder genérico para página inteira */
export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <SkeletonTable rows={4} cols={5} />
      </div>
    </div>
  );
}
