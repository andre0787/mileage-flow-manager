import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renderiza com placeholder", () => {
    render(<Textarea placeholder="Descreva o problema" />);
    expect(screen.getByPlaceholderText("Descreva o problema")).toBeDefined();
  });

  it("chama onChange quando o usuário digita", () => {
    const fn = vi.fn();
    render(<Textarea value="" onChange={fn} />);
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "bug" } });
    expect(fn).toHaveBeenCalled();
  });

  it("usa estilo dark elevado (fundo secondary sólido + borda input) para destacar do fundo preto", () => {
    const { container } = render(<Textarea />);
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeTruthy();
    // Mesmo tratamento do Input (#359): fundo sólido no dark + borda nítida
    expect(textarea!.className).toContain("dark:bg-secondary");
    expect(textarea!.className).toContain("dark:border-input");
    // Micro-interação: hover realça a borda
    expect(textarea!.className).toContain("dark:hover:border-ring/50");
  });
});
