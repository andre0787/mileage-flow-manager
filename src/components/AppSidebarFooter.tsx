import { NavLink, useNavigate } from "react-router";
import { User, Settings, RotateCcw, Bug, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { FeedbackDialog } from "./FeedbackDialog";
import { useAuth } from "@/features/auth";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface AppSidebarFooterProps {
  collapsed: boolean;
  currentPath: string;
}

export function AppSidebarFooter({ collapsed, currentPath }: AppSidebarFooterProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { clearCache } = useData();

  const isActive = (path: string) => currentPath === path;

  const handleClearCache = () => {
    const isConfirmed = window.confirm("Limpar cache? Dados serão recarregados do servidor.");
    if (!isConfirmed) return;

    clearCache();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="mt-auto p-4 border-t border-sidebar-border">
      <div
        className={cn(
          "flex items-center px-3 py-2 rounded-lg transition-colors mb-1",
          !collapsed && "justify-between",
        )}
      >
        {!collapsed && <span className="text-xs text-muted-foreground font-medium">Tema</span>}
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
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium font-body">Configurações</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50">
                <Bug className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium font-body">Reportar problema</span>
                )}
              </button>
            </SidebarMenuButton>
          </FeedbackDialog>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium font-body">Sair</span>}
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
