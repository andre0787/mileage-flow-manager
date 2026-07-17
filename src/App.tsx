import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomTabBar } from "@/components/BottomTabBar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnlineProvider } from "@/contexts/OnlineContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { DataProvider } from "@/contexts/DataContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
      <Route
        path="/"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Dashboard />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/contas"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Contas />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/clientes"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Clientes />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/entradas"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Entradas />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/vendas"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Vendas />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/cpf"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <ControleCPF />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Relatorios />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Configuracoes />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="/perfil"
        element={
          <ErrorBoundary>
            <div className="animate-appear">
              <Perfil />
            </div>
          </ErrorBoundary>
        }
      />
      <Route
        path="*"
        element={
          <div className="animate-appear">
            <NotFound />
          </div>
        }
      />
    </Routes>
  );
};

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/contas": "Contas",
  "/clientes": "Clientes",
  "/entradas": "Entradas",
  "/vendas": "Vendas",
  "/cpf": "Controle CPF",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
  "/perfil": "Perfil",
};

const PageHeader = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname];

  return (
    <header className="h-14 flex items-center border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30 safe-area-top">
      <SidebarTrigger />
      <div className="ml-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-foreground font-display">
          {pageTitle || "MilesControl"}
        </h2>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <LanguageSelector />
        <div className="hidden md:block">
          <KeyboardShortcutsHelp />
        </div>
        <GlobalSearch />
      </div>
    </header>
  );
};

const AppLayout = () => {
  useKeyboardShortcuts();

  return (
    <OnlineProvider>
    <DataProvider>
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OfflineBanner />
          <PageHeader />
            <main
              className="flex-1 p-4 md:p-6 pb-20 md:pb-6 bg-background safe-area-bottom overflow-x-hidden"
              style={{ overscrollBehavior: "contain" }}
            >
              <AnimatedRoutes />
            </main>
          <BottomTabBar />
        </div>
      </div>
    </SidebarProvider>
    </DataProvider>
    </OnlineProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <I18nProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
