import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({ entries: [], clearCache: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn(() => ({ insert: vi.fn() })) },
}));

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza grupos de navegação", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(SidebarProvider, null, createElement(AppSidebar)),
      ),
    );
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Contas")).toBeTruthy();
    expect(screen.getByText("Entradas")).toBeTruthy();
    expect(screen.getByText("Vendas")).toBeTruthy();
    expect(screen.getByText("Clientes")).toBeTruthy();
    expect(screen.getByText("Relatórios")).toBeTruthy();
  });

  it("destaca o item ativo com pill primary", () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/contas"] },
        createElement(SidebarProvider, null, createElement(AppSidebar)),
      ),
    );
    const contas = screen.getByText("Contas").closest("a");
    expect(contas?.className).toContain("bg-primary/10");
    expect(contas?.className).toContain("text-primary");
  });

  it("renderiza ações do rodapé (Perfil, Configurações, Sair)", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(SidebarProvider, null, createElement(AppSidebar)),
      ),
    );
    expect(screen.getByText("Perfil")).toBeTruthy();
    expect(screen.getByText("Configurações")).toBeTruthy();
    expect(screen.getByText("Sair")).toBeTruthy();
  });
});
