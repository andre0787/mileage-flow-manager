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
    render(
      <SearchInput value="" onChange={() => {}} placeholder="Buscar contas..." />
    );
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
      <SearchInput value="" onChange={() => {}} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
