import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardAlertBannersProps {
  overdueCount: number;
  pendingCount: number;
  activeTab: "milhas" | "pontos";
  onViewEntries: () => void;
}

function AlertBanner({
  tone,
  title,
  subtitle,
  onView,
}: {
  tone: "red" | "amber";
  title: string;
  subtitle: string;
  onView: () => void;
}) {
  const isRed = tone === "red";
  return (
    <div
      className={`rounded-lg border p-3 sm:p-4 flex items-start gap-3 animate-appear ${
        isRed
          ? "border-red-400/30 bg-red-50 dark:bg-red-950/20"
          : "border-amber-400/30 bg-amber-50 dark:bg-amber-950/20"
      }`}
      onClick={onView}
    >
      <AlertTriangle
        className={`h-5 w-5 shrink-0 mt-0.5 ${isRed ? "text-destructive" : "text-amber-600"}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${isRed ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}`}
        >
          {title}
        </p>
        <p
          className={`text-xs mt-0.5 ${isRed ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}
        >
          {subtitle}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className={`shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 ${
          isRed
            ? "text-red-700 dark:text-red-400"
            : "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        }`}
        asChild
      >
        <a href="/entradas">Ver →</a>
      </Button>
    </div>
  );
}

export function DashboardAlertBanners({
  overdueCount,
  pendingCount,
  activeTab,
  onViewEntries,
}: DashboardAlertBannersProps) {
  const unitLabel = activeTab === "milhas" ? "Milhas" : "Pontos";

  return (
    <>
      {overdueCount > 0 && (
        <AlertBanner
          tone="red"
          title={`${overdueCount} entrada${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""} — confirmação vencida`}
          subtitle={`Clube de ${unitLabel} — regularize em Entradas para atualizar o saldo`}
          onView={onViewEntries}
        />
      )}
      {pendingCount > 0 && (
        <AlertBanner
          tone="amber"
          title={`${pendingCount} entrada${pendingCount > 1 ? "s" : ""} pendente${pendingCount > 1 ? "s" : ""} de confirmação`}
          subtitle={`Clube de ${unitLabel} — confirme em Entradas para atualizar o saldo`}
          onView={onViewEntries}
        />
      )}
    </>
  );
}
