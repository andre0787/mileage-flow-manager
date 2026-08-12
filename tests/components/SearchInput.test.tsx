import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/ui/SearchInput";

describe("SearchInput", () => {
  it("renderiza com placeholder padrão", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Buscar...")).toBeDefined();
  });

  it("renderiza placeholder customizado", () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Buscar contas..." />);
    expect(screen.getByPlaceholderText("Buscar contas...")).toBeDefined();
  });

  it("exibe o valor atual", () => {
    render(<SearchInput value="teste" onChange={() => {}} />);
    const input = screen.getByPlaceholderText("Buscar...") as HTMLInputElement;
    expect(input.value).toBe("teste");
  });

  it("chama onChange quando o usuário digita", async () => {
    const fn = vi.fn();
    render(<SearchInput value="" onChange={fn} />);
    const input = screen.getByPlaceholderText("Buscar...");
    await userEvent.type(input, "a");
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("exibe botão de limpar quando há valor", () => {
    render(<SearchInput value="teste" onChange={() => {}} />);
    expect(screen.getByLabelText("Limpar busca")).toBeDefined();
  });

  it("não exibe botão de limpar quando vazio", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.queryByLabelText("Limpar busca")).toBeNull();
  });

  it("limpa valor ao clicar no botão X", async () => {
    const fn = vi.fn();
    render(<SearchInput value="teste" onChange={fn} />);
    const clearBtn = screen.getByLabelText("Limpar busca");
    await userEvent.click(clearBtn);
    expect(fn).toHaveBeenCalledWith("");
  });

  it("exibe hotkey ⌘K apenas quando vazio e não focado", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.getByText("K")).toBeDefined();
  });

  it("aplica className customizada", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("usa estilo dark elevado (fundo secondary sólido + borda input) para destacar do fundo preto", () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    const input = container.querySelector("input");
    expect(input).toBeTruthy();
    // Fundo sólido no dark (não esmaecido /60 que virava cinza chapado)
    expect(input!.className).toContain("dark:bg-secondary");
    // Borda nítida visível no dark
    expect(input!.className).toContain("dark:border-input");
    // Micro-interação: hover realça a borda
    expect(input!.className).toContain("dark:hover:border-ring/50");
  });
});
