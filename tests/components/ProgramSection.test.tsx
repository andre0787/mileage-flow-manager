import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProgramSection from "@/components/ProgramSection";
import type { Program, Account } from "@/types";

const mockPrograms: Program[] = [
  {
    id: "p1",
    name: "LATAM Pass",
    type: "milhas",
    maxPassengers: 25,
    passengerCycleType: "anual",
  },
];

const mockAccounts: Account[] = [];

describe("ProgramSection", () => {
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza lista de programas e botão de novo programa", () => {
    render(
      <ProgramSection
        programs={mockPrograms}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("1 programa(s) cadastrado(s)")).toBeDefined();
    expect(screen.getAllByText("LATAM Pass").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Novo Programa/i })).toBeDefined();
  });

  it("abre o diálogo para novo programa e valida submissão", () => {
    render(
      <ProgramSection
        programs={mockPrograms}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    const newBtn = screen.getByRole("button", { name: /Novo Programa/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole("heading", { name: "Novo Programa" })).toBeDefined();

    const saveBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(saveBtn);

    expect(screen.getByText("Nome é obrigatório")).toBeDefined();

    const nameInput = screen.getByLabelText("Nome do Programa");
    fireEvent.change(nameInput, { target: { value: "Smiles" } });

    fireEvent.click(saveBtn);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Smiles",
        type: "milhas",
      })
    );
  });
});
