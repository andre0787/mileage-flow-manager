import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Settings,
  Plane,
  LogOut,
  User,
  Bug,
  RotateCcw,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { FeedbackDialog } from "./FeedbackDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
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
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
    ],
  },
  {
    label: "Controle",
    items: [
      { title: "Controle CPF", url: "/cpf", icon: Shield },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { entries, clearCache } = useData();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = entries.filter(e => e.entryStatus === 'aguardando' && e.date < today).length;

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="hidden md:block">
      <Sidebar collapsible="icon">
        <SidebarContent>
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-sm">
                <Plane className="w-[18px] h-[18px] text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h2 className="text-base font-bold text-foreground font-display">MilesControl</h2>
                  <p className="text-xs text-muted-foreground font-medium tracking-wide">
                    Gestão de Milhas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu — agrupado semanticamente */}
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel
                className={cn(
                  "text-xs font-semibold text-muted-foreground tracking-wider uppercase",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                            "relative group",
                            isActive(item.url)
                              ? "bg-primary/[0.08] text-primary font-semibold border-l-2 border-primary pl-[10px]"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent",
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

          {/* Bottom Actions */}
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div
              className={cn(
                "flex items-center px-3 py-2 rounded-lg transition-colors mb-1",
                !collapsed && "justify-between",
              )}
            >
              {!collapsed && (
                <span className="text-xs text-muted-foreground font-medium">Tema</span>
              )}
              <ThemeToggle />
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/perfil"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive("/perfil")
                        ? "bg-primary/[0.08] text-primary font-semibold border-l-2 border-primary pl-[10px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent",
                    )}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium font-body">Perfil</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/configuracoes"
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      isActive("/configuracoes")
                        ? "bg-primary/[0.08] text-primary font-semibold border-l-2 border-primary pl-[10px]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent",
                    )}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium font-body">Configurações</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => {
                      if (window.confirm("Limpar cache? Dados serão recarregados do servidor.")) {
                        clearCache();
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent"
                    title="Limpar cache local e recarregar dados"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium font-body">Limpar Cache</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <FeedbackDialog>
                  <SidebarMenuButton asChild>
                    <button className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent">
                      <Bug className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="text-sm font-medium font-body">Reportar problema</span>}
                    </button>
                  </SidebarMenuButton>
                </FeedbackDialog>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/login");
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium font-body">Sair</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarContent>
      </Sidebar>
    </div>
  );
}
