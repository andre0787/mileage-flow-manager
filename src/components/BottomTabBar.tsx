import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, CreditCard, TrendingUp, TrendingDown, Settings, RotateCcw } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

export function BottomTabBar() {
  const location = useLocation();
  const { entries, clearCache } = useData();
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = entries.filter(e => e.entryStatus === 'aguardando' && e.date < today).length;

  const isActive = (path: string) => location.pathname === path;
  const btnClass = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-3 py-1 rounded-lg transition-all duration-200 relative",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-lg border-t flex items-center justify-around md:hidden safe-area-bottom">
      {/* Dashboard */}
      <NavLink to="/" className={btnClass(isActive("/"))}>
        {isActive("/") && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />}
        <LayoutDashboard className={cn("h-5 w-5 transition-transform", isActive("/") && "scale-110")} />
        <span className={cn("text-xs font-medium leading-tight font-display", isActive("/") && "font-semibold")}>
          Dashboard
        </span>
      </NavLink>

      {/* Contas */}
      <NavLink to="/contas" className={btnClass(isActive("/contas"))}>
        {isActive("/contas") && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />}
        <CreditCard className={cn("h-5 w-5 transition-transform", isActive("/contas") && "scale-110")} />
        <span className={cn("text-xs font-medium leading-tight font-display", isActive("/contas") && "font-semibold")}>
          Contas
        </span>
      </NavLink>

      {/* Entradas */}
      <NavLink to="/entradas" className={btnClass(isActive("/entradas"))}>
        {isActive("/entradas") && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />}
        <div className="relative">
          <TrendingUp className={cn("h-5 w-5 transition-transform", isActive("/entradas") && "scale-110")} />
          {overdueCount > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
              {overdueCount}
            </span>
          )}
        </div>
        <span className={cn("text-xs font-medium leading-tight font-display", isActive("/entradas") && "font-semibold")}>
          Entradas
        </span>
      </NavLink>

      {/* Vendas */}
      <NavLink to="/vendas" className={btnClass(isActive("/vendas"))}>
        {isActive("/vendas") && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />}
        <TrendingDown className={cn("h-5 w-5 transition-transform", isActive("/vendas") && "scale-110")} />
        <span className={cn("text-xs font-medium leading-tight font-display", isActive("/vendas") && "font-semibold")}>
          Vendas
        </span>
      </NavLink>

      {/* Ajustes */}
      <NavLink to="/configuracoes" className={btnClass(isActive("/configuracoes"))}>
        {isActive("/configuracoes") && <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />}
        <Settings className={cn("h-5 w-5 transition-transform", isActive("/configuracoes") && "scale-110")} />
        <span className={cn("text-xs font-medium leading-tight font-display", isActive("/configuracoes") && "font-semibold")}>
          Ajustes
        </span>
      </NavLink>

      {/* Limpar Cache */}
      <button
        onClick={() => {
          if (window.confirm("Limpar cache? Dados serão recarregados do servidor.")) {
            clearCache();
          }
        }}
        className={btnClass(false)}
        title="Limpar cache local e recarregar dados"
      >
        <RotateCcw className="h-5 w-5" />
        <span className="text-xs font-medium leading-tight font-display">
          Cache
        </span>
      </button>
    </nav>
  );
}
