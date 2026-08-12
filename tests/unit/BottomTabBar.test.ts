import { describe, expect, it, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BottomTabBar } from "@/components/BottomTabBar";

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({ entries: [] }),
}));

describe("BottomTabBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza os 5 itens de navegação", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(BottomTabBar),
      ),
    );
    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Contas")).toBeTruthy();
    expect(screen.getByText("Entradas")).toBeTruthy();
    expect(screen.getByText("Vendas")).toBeTruthy();
    expect(screen.getByText("Ajustes")).toBeTruthy();
  });

  it("não mostra badge de atraso sem entradas pendentes", () => {
    render(
      createElement(
        MemoryRouter,
        null,
        createElement(BottomTabBar),
      ),
    );
    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();
  });

  it("marca a rota ativa com texto primário", () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/contas"] },
        createElement(BottomTabBar),
      ),
    );
    const contas = screen.getByText("Contas").closest("a");
    expect(contas?.className).toContain("text-primary");
  });
});
