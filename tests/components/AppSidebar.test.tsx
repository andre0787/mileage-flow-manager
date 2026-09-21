import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const clearCacheMock = vi.fn();
const signOutMock = vi.fn();
let mockEntries: Array<{ id: string; entryStatus: string; date: string }> = [
  {
    id: "e1",
    entryStatus: "aguardando",
    date: "2020-01-01", // overdue entry
  },
  {
    id: "e2",
    entryStatus: "confirmada",
    date: "2020-01-01",
  },
];

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    entries: mockEntries,
    clearCache: clearCacheMock,
  }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ signOut: signOutMock }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn(() => ({ insert: vi.fn() })) },
}));

describe("AppSidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEntries = [
      {
        id: "e1",
        entryStatus: "aguardando",
        date: "2020-01-01",
      },
      {
        id: "e2",
        entryStatus: "confirmada",
        date: "2020-01-01",
      },
    ];
  });

  it("renderiza cabeçalho, grupos e itens de navegação", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    // Title
    expect(screen.getByText("MilesControl")).toBeDefined();

    // Group labels
    expect(screen.getByText("Operação")).toBeDefined();
    expect(screen.getByText("Pessoas")).toBeDefined();
    expect(screen.getByText("Controle")).toBeDefined();

    // Menu items
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Contas")).toBeDefined();
    expect(screen.getByText("Entradas")).toBeDefined();
    expect(screen.getByText("Vendas")).toBeDefined();
    expect(screen.getByText("Clientes")).toBeDefined();
    expect(screen.getByText("Controle CPF")).toBeDefined();
    expect(screen.getByText("Relatórios")).toBeDefined();
    expect(screen.getByText("KPIs de Processo")).toBeDefined();
    expect(screen.getByText("Workflow")).toBeDefined();
  });

  it("destaca a rota ativa com estilos de destaque", () => {
    render(
      <MemoryRouter initialEntries={["/contas"]}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const contasLink = screen.getByText("Contas").closest("a");
    expect(contasLink?.className).toContain("bg-primary/10");
    expect(contasLink?.className).toContain("text-primary");
  });

  it("exibe badge de pendências em atraso na opção Entradas quando houver entradas atrasadas", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    // Overdue count is 1 from mock entries
    expect(screen.getByText("1")).toBeDefined();
  });

  it("não exibe badge de pendências em atraso quando não houver entradas atrasadas", () => {
    mockEntries = [
      {
        id: "e1",
        entryStatus: "confirmada",
        date: "2020-01-01",
      },
    ];

    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const entradasBadgeContainer = screen.getByText("Entradas").closest("a");
    expect(entradasBadgeContainer?.querySelector(".bg-amber-500")).toBeNull();
  });

  it("oculta textos e títulos quando a sidebar estiver colapsada", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.queryByText("MilesControl")).toBeNull();
    expect(screen.queryByText("Dashboard")).toBeNull();
  });

  it("renderiza opções do rodapé (Perfil, Configurações, Reportar problema e Tema)", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText("Perfil")).toBeDefined();
    expect(screen.getByText("Configurações")).toBeDefined();
    expect(screen.getByText("Reportar problema")).toBeDefined();
    expect(screen.getByText("Tema")).toBeDefined();
  });

  it("executa a ação de limpar cache quando confirmada", () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const clearButton = screen.getByText("Limpar Cache");

    // Cancel modal
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    fireEvent.click(clearButton);
    expect(confirmSpy).toHaveBeenCalledWith(
      "Limpar cache? Dados serão recarregados do servidor.",
    );
    expect(clearCacheMock).not.toHaveBeenCalled();

    // Confirm modal
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(clearButton);
    expect(clearCacheMock).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it("executa o encerramento de sessão ao clicar em Sair", async () => {
    render(
      <MemoryRouter>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>,
    );

    const signOutButton = screen.getByText("Sair");
    await act(async () => {
      fireEvent.click(signOutButton);
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
  });
});
