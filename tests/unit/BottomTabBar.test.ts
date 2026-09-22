import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { BottomTabBar } from "@/components/BottomTabBar";

const mockUseData = vi.fn();

vi.mock("@/contexts/DataContext", () => ({
  useData: () => mockUseData(),
}));

describe("BottomTabBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue({ entries: [] });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza os 5 itens de navegação com os links corretos", () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/"] },
        createElement(BottomTabBar),
      ),
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.getByText("Contas")).toBeTruthy();
    expect(screen.getByText("Entradas")).toBeTruthy();
    expect(screen.getByText("Vendas")).toBeTruthy();
    expect(screen.getByText("Ajustes")).toBeTruthy();

    expect(links[0].getAttribute("href")).toBe("/");
    expect(links[1].getAttribute("href")).toBe("/contas");
    expect(links[2].getAttribute("href")).toBe("/entradas");
    expect(links[3].getAttribute("href")).toBe("/vendas");
    expect(links[4].getAttribute("href")).toBe("/configuracoes");
  });

  it("não mostra badge de atraso sem entradas pendentes ou atrasadas", () => {
    mockUseData.mockReturnValue({
      entries: [
        { id: "1", entryStatus: "pago", date: "2026-03-01" },
        { id: "2", entryStatus: "aguardando", date: "2026-03-15" },
        { id: "3", entryStatus: "aguardando", date: "2026-03-20" },
      ],
    });

    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/"] },
        createElement(BottomTabBar),
      ),
    );

    expect(screen.queryByText(/^[0-9]+$/)).toBeNull();
  });

  it("calcula e exibe a badge com contagem de entradas atrasadas no botão de Entradas", () => {
    mockUseData.mockReturnValue({
      entries: [
        { id: "1", entryStatus: "aguardando", date: "2026-03-10" },
        { id: "2", entryStatus: "aguardando", date: "2026-03-14" },
        { id: "3", entryStatus: "pago", date: "2026-03-05" },
        { id: "4", entryStatus: "aguardando", date: "2026-03-15" },
      ],
    });

    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/"] },
        createElement(BottomTabBar),
      ),
    );

    const badge = screen.getByText("2");
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("bg-amber-500");

    const entradasLink = screen.getByText("Entradas").closest("a");
    expect(entradasLink?.contains(badge)).toBe(true);
  });

  it("destaca corretamente a rota ativa e mantém as inativas secundárias", () => {
    render(
      createElement(
        MemoryRouter,
        { initialEntries: ["/vendas"] },
        createElement(BottomTabBar),
      ),
    );

    const vendasLink = screen.getByText("Vendas").closest("a");
    const dashboardLink = screen.getByText("Dashboard").closest("a");

    expect(vendasLink?.className).toContain("text-primary");
    expect(dashboardLink?.className).toContain("text-muted-foreground");
  });
});
