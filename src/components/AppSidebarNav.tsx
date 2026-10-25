import { NavLink } from "react-router";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Workflow as WorkflowIcon,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const isAgentLabEnabled = import.meta.env.VITE_AGENT_LAB_ENABLED === "true";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled?: boolean;
}

const menuGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operação",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Contas", url: "/contas", icon: CreditCard },
      { title: "Entradas", url: "/entradas", icon: TrendingUp },
      { title: "Vendas", url: "/vendas", icon: TrendingDown },
    ],
  },
  {
    label: "Pessoas",
    items: [{ title: "Clientes", url: "/clientes", icon: Users }],
  },
  {
    label: "Controle",
    items: [
      { title: "Controle CPF", url: "/cpf", icon: Shield },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "KPIs de Processo", url: "/kpi", icon: TrendingUp },
      { title: "Workflow", url: "/workflow", icon: WorkflowIcon },
      { title: "Agent Lab", url: "/agent-lab", icon: FlaskConical, enabled: isAgentLabEnabled },
    ],
  },
];

interface AppSidebarNavProps {
  collapsed: boolean;
  currentPath: string;
  overdueCount: number;
}

export function AppSidebarNav({ collapsed, currentPath, overdueCount }: AppSidebarNavProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {menuGroups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel
            className={cn(
              "text-xs font-semibold text-muted-foreground tracking-wide",
              collapsed && "sr-only",
            )}
          >
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items
                .filter((item) => item.enabled !== false)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          "relative group",
                          isActive(item.url)
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-transform duration-200",
                            !isActive(item.url) && "group-hover:scale-110",
                          )}
                        />
                        {!collapsed && (
                          <span className="text-sm font-medium font-body">{item.title}</span>
                        )}
                        {!collapsed && item.title === "Entradas" && overdueCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                            {overdueCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
