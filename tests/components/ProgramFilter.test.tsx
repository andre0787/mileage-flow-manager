import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgramFilter, ALL_PROGRAMS } from "@/components/ui/ProgramFilter";
import type { Program } from "@/types";

const mockPrograms: Program[] = [
  { id: "p1", name: "Smiles", type: "milhas" },
  { id: "p2", name: "Latam Pass", type: "milhas" },
];

describe("ProgramFilter", () => {
  it("renderiza Todos os Programas e as opções", () => {
    render(<ProgramFilter programs={mockPrograms} value={ALL_PROGRAMS} onChange={vi.fn()} />);

    expect(screen.getByText("Todos os Programas")).toBeDefined();
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Smiles")).toBeDefined();
    expect(screen.getByText("Latam Pass")).toBeDefined();
  });

  it("chama onChange com o id ao selecionar um programa", () => {
    const onChange = vi.fn();
    render(<ProgramFilter programs={mockPrograms} value={ALL_PROGRAMS} onChange={onChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Latam Pass"));

    expect(onChange).toHaveBeenCalledWith("p2");
  });
});
