import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TabItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const tabs: TabItem[] = [
  { title: "Resumo", url: "/", icon: LayoutDashboard },
  { title: "Entradas", url: "/entradas", icon: TrendingUp },
  { title: "Vendas", url: "/vendas", icon: TrendingDown },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Ajustes", url: "/configuracoes", icon: Settings },
]

export function BottomTabBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-lg border-t flex items-center justify-around md:hidden safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.url
        return (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-3 py-1 rounded-lg transition-all duration-200 relative",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <span className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
            <tab.icon className={cn(
              "h-5 w-5 transition-transform duration-200",
              isActive && "scale-110"
            )} />
            <span className={cn(
              "text-[11px] font-medium leading-tight font-display",
              isActive && "font-semibold"
            )}>
              {tab.title}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
