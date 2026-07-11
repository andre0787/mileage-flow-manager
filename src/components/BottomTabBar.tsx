import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, TrendingDown, Users, User, Settings } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

interface TabItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { title: "Resumo", url: "/", icon: LayoutDashboard },
  { title: "Entradas", url: "/entradas", icon: TrendingUp },
  { title: "Vendas", url: "/vendas", icon: TrendingDown },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Perfil", url: "/perfil", icon: User },
  { title: "Ajustes", url: "/configuracoes", icon: Settings },
];

export function BottomTabBar() {
  const location = useLocation();
  const { entries } = useData();
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = entries.filter(e => e.entryStatus === 'aguardando' && e.date < today).length;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-lg border-t flex items-center justify-around md:hidden safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.url;
        return (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-3 py-1 rounded-lg transition-all duration-200 relative",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive && (
              <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
            <div className="relative">
              <tab.icon
                className={cn("h-5 w-5 transition-transform duration-200", isActive && "scale-110")}
              />
              {tab.title === "Entradas" && overdueCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                  {overdueCount}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium leading-tight font-display",
                isActive && "font-semibold",
              )}
            >
              {tab.title}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
