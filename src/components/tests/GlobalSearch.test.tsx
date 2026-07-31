import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
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
});
