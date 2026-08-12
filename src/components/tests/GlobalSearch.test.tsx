import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { GlobalSearch } from "@/components/GlobalSearch";

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    entries: [],
    sales: [],
    clients: [],
    accounts: [],
    programs: [],
    origemTypes: [],
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("GlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza campo de busca com placeholder", () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText("Buscar…")).toBeDefined();
  });

  it("mostra 'Nenhum resultado' quando busca vazia", () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText("Buscar…");
    fireEvent.change(input, { target: { value: "xyz-inexistente" } });
    expect(screen.getByText(/Nenhum resultado para/)).toBeDefined();
  });

  it("não exibe dropdown com query vazia", () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/Nenhum resultado para/)).toBeNull();
  });

  it("usa estilo dark elevado no dropdown e no kbd (legível sobre fundo preto)", () => {
    const { container } = render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    const input = container.querySelector("input");
    // Input herda o tratamento dark do Input base
    expect(input!.className).toContain("dark:bg-secondary");
    expect(input!.className).toContain("dark:border-input");

    // Dropdown: card elevado (11%) em vez de preto puro — dispara com query
    const inputEl = screen.getByPlaceholderText("Buscar…");
    fireEvent.change(inputEl, { target: { value: "x" } });
    const dropdown = container.querySelector(".absolute.right-0.top-full");
    expect(dropdown).toBeTruthy();
    expect(dropdown!.className).toContain("dark:bg-card");
    expect(dropdown!.className).toContain("dark:border-border/70");
  });
});
