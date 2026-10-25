import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import AdminEventos from "@/pages/AdminEventos";

describe("AdminEventos Page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const getStatValue = (label: string): string | undefined => {
    const heading = screen.getByRole("heading", { name: label });
    return heading.closest("div")?.nextElementSibling?.textContent?.trim();
  };

  it("renders heading and empty state when localStorage is empty", () => {
    render(<AdminEventos />);
    expect(screen.getByRole("heading", { name: /Observabilidade/i })).toBeDefined();
    expect(screen.getByText(/Nenhum evento registrado/i)).toBeDefined();
    expect(getStatValue("Total")).toBe("0");
  });

  it("handles corrupt JSON in localStorage gracefully", () => {
    localStorage.setItem("mc_debug_logs", "{ invalid json }");
    render(<AdminEventos />);
    expect(screen.getByText(/Nenhum evento registrado/i)).toBeDefined();
    expect(getStatValue("Total")).toBe("0");
  });

  it("renders log entries in reverse order and updates stats", () => {
    const mockLogs = [
      {
        timestamp: "2025-01-01T10:00:00.000Z",
        type: "info",
        context: "Primeiro log info",
      },
      {
        timestamp: "2025-01-01T11:00:00.000Z",
        type: "error",
        context: "Erro na operacao",
        error: "Falha ao conectar DB",
        details: { code: 500 },
      },
      {
        timestamp: "2025-01-01T12:00:00.000Z",
        type: "destructive_op",
        context: "Exclusao de registro",
      },
      {
        timestamp: "2025-01-01T13:00:00.000Z",
        type: "warn",
        context: "Aviso de limite",
      },
    ];

    localStorage.setItem("mc_debug_logs", JSON.stringify(mockLogs));
    render(<AdminEventos />);

    expect(getStatValue("Total")).toBe("4");
    expect(getStatValue("Erros")).toBe("1");
    expect(getStatValue("Destrutivas")).toBe("1");
    expect(getStatValue("Info")).toBe("1");
    expect(getStatValue("Avisos")).toBe("1");

    expect(screen.getByText("Primeiro log info")).toBeDefined();
    expect(screen.getByText("Erro na operacao")).toBeDefined();
    expect(screen.getByText("Falha ao conectar DB")).toBeDefined();
    expect(screen.getByText(/"code": 500/)).toBeDefined();

    const contexts = screen
      .getAllByText(/(Primeiro log info|Erro na operacao|Exclusao de registro|Aviso de limite)/)
      .map((el) => el.textContent);
    expect(contexts[0]).toContain("Aviso de limite");
    expect(contexts[3]).toContain("Primeiro log info");
  });

  it("filters log entries by type when filter tabs are clicked", () => {
    const mockLogs = [
      { timestamp: "2025-01-01T10:00:00.000Z", type: "info", context: "Info item" },
      { timestamp: "2025-01-01T11:00:00.000Z", type: "error", context: "Error item" },
    ];
    localStorage.setItem("mc_debug_logs", JSON.stringify(mockLogs));
    render(<AdminEventos />);

    fireEvent.click(screen.getByRole("button", { name: "Erro" }));
    expect(screen.getByText("Error item")).toBeDefined();
    expect(screen.queryByText("Info item")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByText("Info item")).toBeDefined();
    expect(screen.getByText("Error item")).toBeDefined();
  });

  it("clears logs when 'Limpar logs' button is clicked", () => {
    const mockLogs = [{ timestamp: "2025-01-01T10:00:00.000Z", type: "info", context: "Test log" }];
    localStorage.setItem("mc_debug_logs", JSON.stringify(mockLogs));
    render(<AdminEventos />);

    expect(screen.getByText("Test log")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Limpar logs" }));

    expect(screen.queryByText("Test log")).toBeNull();
    expect(screen.getByText(/Nenhum evento registrado/i)).toBeDefined();
    expect(localStorage.getItem("mc_debug_logs")).toBeNull();
  });
});
