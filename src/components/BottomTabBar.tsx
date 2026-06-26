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
    <nav className="fixed bottom-0 inset-x-0 z-40 h-16 bg-background border-t flex items-center justify-around md:hidden safe-area-bottom">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.url
        return (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-3 py-1 rounded-lg transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">{tab.title}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
