import { AltitudeBar } from "@/components/AltitudeBar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { BalanceReconcileBanner } from "@/components/BalanceReconcileBanner";
import { HeroDecor } from "@/components/dashboard/HeroDecor";
import { HeroStats } from "@/components/dashboard/HeroStats";
import { cn } from "@/lib/utils";
import type { Account, Owner } from "@/types";

const VARIANTS = {
  milhas: {
    sectionClass: "border-primary/15",
    gradientClass: "bg-gradient-hero",
    bottomBarClass: "from-primary/25 via-primary/10 to-teal/25",
  },
  pontos: {
    sectionClass: "border-teal/20",
    gradientClass: "bg-gradient-hero-teal",
    bottomBarClass: "from-teal/40 via-gold/30 to-teal/20",
  },
} as const;

export interface DashboardHeroProps {
  variant: "milhas" | "pontos";
  currentMetrics: {
    totalMiles: number;
    totalInvested: number;
    activeAccounts: number;
    totalSoldMiles: number;
    avgCostPerMile: number;
    avgProfitMargin: number;
    totalRevenue: number;
    monthlyMilesIn: number;
  };
  /** Métricas financeiras (Margem/Receita) — apenas a variante Milhas usa */
  financialMetrics?: {
    avgProfitMargin: number;
    totalRevenue: number;
  };
  owners: Owner[];
  selectedOwner: string | null;
  /** Contas já filtradas (por dono quando selecionado) para o banner de reconciliação */
  reconcileAccounts: Account[];
  goal: number;
}

export function DashboardHero({
  variant,
  currentMetrics,
  financialMetrics,
  owners,
  selectedOwner,
  reconcileAccounts,
  goal,
}: DashboardHeroProps) {
  const v = VARIANTS[variant];
  const isMilhas = variant === "milhas";
  const ownerLabel = selectedOwner
    ? (owners.find((o) => o.id === selectedOwner)?.name ?? "Sistema")
    : isMilhas
      ? "Sistema Operacional"
      : "Investimento em Pontos";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-elegant animate-appear",
        v.sectionClass,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-[length:200%_200%] animate-gradient-shift",
          v.gradientClass,
        )}
      />
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute inset-0 bg-grid-subtle [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
      <HeroDecor variant={variant} />

      <div className="relative p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
            <span className="relative rounded-full bg-success h-2 w-2" />
          </span>
          <span className="text-xs tracking-wide text-muted-foreground font-medium">
            {ownerLabel}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR")}
          </span>
        </div>

        <AltitudeBar
          value={currentMetrics.totalMiles}
          goal={goal}
          className="mb-5"
          color={
            isMilhas ? undefined : "linear-gradient(90deg, hsl(var(--teal)), hsl(var(--gold)))"
          }
        />

        <BalanceReconcileBanner
          computedTotal={currentMetrics.totalMiles}
          accounts={reconcileAccounts}
        />

        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 sm:gap-3">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-foreground tracking-tight leading-none tabular-nums">
                <AnimatedNumber value={currentMetrics.totalMiles} />
              </h1>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide font-display">
                {isMilhas ? "milhas" : "pontos"}
              </span>
            </div>

            <HeroStats
              variant={variant}
              currentMetrics={currentMetrics}
              financialMetrics={financialMetrics}
            />
          </div>
        </div>
      </div>

      <div className={cn("relative h-1 bg-gradient-to-r", v.bottomBarClass)} />
    </section>
  );
}
