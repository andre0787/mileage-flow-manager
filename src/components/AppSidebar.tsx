import { useLocation } from "react-router";
import { useData } from "@/contexts/DataContext";
import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { AppSidebarHeader } from "./AppSidebarHeader";
import { AppSidebarNav } from "./AppSidebarNav";
import { AppSidebarFooter } from "./AppSidebarFooter";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { entries } = useData();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const today = new Date().toISOString().split("T")[0];
  const overdueCount = entries.filter(
    (e) => e.entryStatus === "aguardando" && e.date < today,
  ).length;

  return (
    <div className="hidden md:block">
      <Sidebar collapsible="icon">
        <SidebarContent>
          <AppSidebarHeader collapsed={collapsed} />
          <AppSidebarNav
            collapsed={collapsed}
            currentPath={currentPath}
            overdueCount={overdueCount}
          />
          <AppSidebarFooter collapsed={collapsed} currentPath={currentPath} />
        </SidebarContent>
      </Sidebar>
    </div>
  );
}
