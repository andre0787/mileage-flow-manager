import { Plane } from "lucide-react";

interface AppSidebarHeaderProps {
  collapsed: boolean;
}

export function AppSidebarHeader({ collapsed }: AppSidebarHeaderProps) {
  return (
    <div className="p-4 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-[10px] flex items-center justify-center shadow-sm">
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
  );
}
