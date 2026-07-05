import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contas from "./pages/Contas";
import Clientes from "./pages/Clientes";
import Entradas from "./pages/Entradas";
import Vendas from "./pages/Vendas";
import ControleCPF from "./pages/ControleCPF";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<ErrorBoundary><div className="animate-appear"><Dashboard /></div></ErrorBoundary>} />
      <Route path="/contas" element={<ErrorBoundary><div className="animate-appear"><Contas /></div></ErrorBoundary>} />
      <Route path="/clientes" element={<ErrorBoundary><div className="animate-appear"><Clientes /></div></ErrorBoundary>} />
      <Route path="/entradas" element={<ErrorBoundary><div className="animate-appear"><Entradas /></div></ErrorBoundary>} />
      <Route path="/vendas" element={<ErrorBoundary><div className="animate-appear"><Vendas /></div></ErrorBoundary>} />
      <Route path="/cpf" element={<ErrorBoundary><div className="animate-appear"><ControleCPF /></div></ErrorBoundary>} />
      <Route path="/relatorios" element={<ErrorBoundary><div className="animate-appear"><Relatorios /></div></ErrorBoundary>} />
      <Route path="/configuracoes" element={<ErrorBoundary><div className="animate-appear"><Configuracoes /></div></ErrorBoundary>} />
      <Route path="/perfil" element={<ErrorBoundary><div className="animate-appear"><Perfil /></div></ErrorBoundary>} />
      <Route path="*" element={<div className="animate-appear"><NotFound /></div>} />
    </Routes>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30 safe-area-top">
            <SidebarTrigger />
            <div className="ml-4">
              <h2 className="text-base font-semibold text-foreground font-display">MilesControl</h2>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 bg-background safe-area-bottom overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
            <DataProvider>
              <AnimatedRoutes />
            </DataProvider>
          </main>
          <BottomTabBar />
        </div>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
