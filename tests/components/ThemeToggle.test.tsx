import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

describe("ThemeToggle", () => {
  const setThemeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o botão de alternar tema com atributos de acessibilidade", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: setThemeMock,
      forcedTheme: undefined,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /alternar tema/i });
    expect(button).toBeTruthy();
    expect(screen.getByText("Toggle theme")).toBeTruthy();
  });

  it("alterna de escuro (dark) para claro (light) ao clicar", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      setTheme: setThemeMock,
      forcedTheme: undefined,
      resolvedTheme: "dark",
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /alternar tema/i });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledTimes(1);
    expect(setThemeMock).toHaveBeenCalledWith("light");
  });

  it("alterna de claro (light) para escuro (dark) ao clicar", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "light",
      setTheme: setThemeMock,
      forcedTheme: undefined,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /alternar tema/i });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledTimes(1);
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("muda para escuro (dark) quando o tema é indefinido ou de sistema", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "system",
      setTheme: setThemeMock,
      forcedTheme: undefined,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /alternar tema/i });
    fireEvent.click(button);

    expect(setThemeMock).toHaveBeenCalledTimes(1);
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
