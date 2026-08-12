import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

describe("Select", () => {
  it("renderiza trigger com placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Todos os Donos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText("Todos os Donos")).toBeDefined();
  });

  it("usa estilo dark elevado (fundo secondary sólido + borda input) para destacar do fundo preto", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Filtro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = container.querySelector("button");
    expect(trigger).toBeTruthy();
    // Mesmo tratamento do Input (#359): fundo sólido no dark + borda nítida
    expect(trigger!.className).toContain("dark:bg-secondary");
    expect(trigger!.className).toContain("dark:border-input");
    // Micro-interação: hover realça a borda
    expect(trigger!.className).toContain("dark:hover:border-ring/50");
  });
});
