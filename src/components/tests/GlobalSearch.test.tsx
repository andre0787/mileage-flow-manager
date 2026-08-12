import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { GlobalSearch } from "@/components/GlobalSearch";

const navigateMock = vi.fn();

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    entries: [
      {
        id: "e1",
        accountId: "a1",
        origemTypeId: "ot1",
        date: "2026-08-12",
        milesGenerated: 10000,
        amount: 100,
      },
    ],
    sales: [],
    clients: [],
    accounts: [{ id: "a1", name: "Conta Milhas", type: "milhas", balance: 50000 }],
    programs: [],
    origemTypes: [{ id: "ot1", name: "Clube Fidelidade" }],
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
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

  it("dropdown tem animação de entrada suave (fade + zoom)", () => {
    const { container } = render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    const inputEl = screen.getByPlaceholderText("Buscar…");
    fireEvent.change(inputEl, { target: { value: "conta" } });
    const dropdown = container.querySelector(".absolute.right-0.top-full");
    expect(dropdown!.className).toContain("animate-in");
    expect(dropdown!.className).toContain("fade-in-0");
    expect(dropdown!.className).toContain("zoom-in-95");
  });

  it("navega por teclado: ArrowDown destaca resultado e Enter seleciona", () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText("Buscar…");
    fireEvent.change(input, { target: { value: "conta" } });

    // Existe ao menos um resultado (Conta Milhas)
    expect(screen.getByText("Conta Milhas")).toBeDefined();

    // Nenhum item ativo antes da seta
    expect(screen.queryByRole("option", { selected: true })).toBeNull();

    // ↓ destaca o primeiro resultado
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const option = screen.getByRole("option", { selected: true });
    expect(option).toBeDefined();

    // Enter navega para o destino do item (primeiro da lista = entrada, que
    // casa com "conta" via subtítulo "Conta Milhas")
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigateMock).toHaveBeenCalledWith("/entradas");
  });

  it("Enter não dispara sem item ativo e as setas envolvem a lista (wrap)", () => {
    render(
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText("Buscar…");
    fireEvent.change(input, { target: { value: "conta" } });

    // Enter sem ArrowDown não navega
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigateMock).not.toHaveBeenCalled();

    // ↓ destaca o primeiro (entrada) e ↑ envolve para o último (conta) — 2 resultados
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByRole("option", { selected: true })).toBeDefined();

    // Enter então navega para o item envolvido (conta)
    fireEvent.keyDown(input, { key: "Enter" });
    expect(navigateMock).toHaveBeenCalledWith("/contas");
  });
});
