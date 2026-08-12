import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Dashboard from "@/pages/Dashboard";

const mockData = {
  owners: [],
  accounts: [],
  programs: [],
  sales: [],
  entries: [],
  origemTypes: [],
  isLoading: false,
};

vi.mock("@/contexts/DataContext", () => ({
  useData: () => mockData,
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza abas Milhas/Pontos com dados vazios", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(screen.getByText("Milhas")).toBeTruthy();
    expect(screen.getByText("Pontos")).toBeTruthy();
    expect(screen.getByText("Todos")).toBeTruthy();
  });

  it("exibe estado vazio de vendas", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(screen.getByText("Nenhuma venda registrada")).toBeTruthy();
  });

  it("mostra skeleton enquanto isLoading", () => {
    mockData.isLoading = true;
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(Dashboard),
      ),
    );
    expect(document.querySelector(".animate-pulse")).toBeTruthy();
    mockData.isLoading = false;
  });
});
