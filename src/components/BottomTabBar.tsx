import { NavLink, useLocation } from "react-router";
import { LayoutDashboard, CreditCard, TrendingUp, TrendingDown, Settings } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

/**
 * Bar de navegação inferior (mobile only).
 *
 * 5 itens primários (alvos de toque confortáveis em 375px).
 * "Reportar problema" foi movido para a sidebar/header — ação secundária
 * não deve competir por espaço na nav principal.
 */

const TABS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/contas", label: "Contas", icon: CreditCard },
  { to: "/entradas", label: "Entradas", icon: TrendingUp },
  { to: "/vendas", label: "Vendas", icon: TrendingDown },
  { to: "/configuracoes", label: "Ajustes", icon: Settings },
];

interface TabProps {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  active: boolean;
  badge?: number;
}

function Tab({ to, label, icon: Icon, end, active, badge }: TabProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[56px] py-1.5 rounded-full transition-all duration-200 relative",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-200",
          active ? "bg-primary/10 px-4 py-1" : "py-1",
        )}
      >
        <div className="relative">
          <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-[11px] font-medium leading-tight font-display",
            active && "font-semibold",
          )}
        >
          {label}
        </span>
      </div>
    </NavLink>
  );
}

export function BottomTabBar() {
  const location = useLocation();
  const { entries } = useData();
  const today = new Date().toISOString().split("T")[0];
  const overdueCount = entries.filter(
    (e) => e.entryStatus === "aguardando" && e.date < today,
  ).length;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/60 flex items-stretch justify-around md:hidden safe-area-bottom">
      {TABS.map((tab) => (
        <Tab
          key={tab.to}
          {...tab}
          active={location.pathname === tab.to}
          badge={tab.to === "/entradas" ? overdueCount : undefined}
        />
      ))}
    </nav>
  );
}
