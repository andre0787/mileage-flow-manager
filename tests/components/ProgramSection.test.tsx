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
  {
    id: "p2",
    name: "Livelo",
    type: "pontos",
    maxPassengers: 10,
    passengerCycleType: "dias",
    passengerCycleDays: 365,
  },
];

const mockAccounts: Account[] = [
  {
    id: "acc1",
    name: "Conta 1",
    programId: "p1",
    type: "milhas",
  } as Account,
];

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

    expect(screen.getByText("2 programa(s) cadastrado(s)")).toBeDefined();
    expect(screen.getAllByText("LATAM Pass").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Livelo").length).toBeGreaterThan(0);
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

  it("permite editar um programa existente", () => {
    render(
      <ProgramSection
        programs={mockPrograms}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    const editButtons = screen.getAllByRole("button", { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole("heading", { name: "Editar Programa" })).toBeDefined();

    const nameInput = screen.getByLabelText("Nome do Programa") as HTMLInputElement;
    expect(nameInput.value).toBe("LATAM Pass");

    fireEvent.change(nameInput, { target: { value: "LATAM Pass Red" } });

    const saveBtn = screen.getByRole("button", { name: "Salvar Alterações" });
    fireEvent.click(saveBtn);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "p1",
        name: "LATAM Pass Red",
      })
    );
  });

  it("valida obrigatoriedade de maxPassengers e passengerCycleDays quando seleções de ciclo estão ativas", () => {
    render(
      <ProgramSection
        programs={[]}
        accounts={[]}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    const newBtn = screen.getByRole("button", { name: /Novo Programa/i });
    fireEvent.click(newBtn);

    const nameInput = screen.getByLabelText("Nome do Programa");
    fireEvent.change(nameInput, { target: { value: "TudoAzul" } });

    const cycleSelects = screen.getAllByRole("combobox");
    // Cycle type selector is second combobox
    fireEvent.click(cycleSelects[1]);

    const annualOption = screen.getByRole("option", { name: "Ciclo Anual" });
    fireEvent.click(annualOption);

    const saveBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(saveBtn);

    expect(screen.getByText("Máx. Passageiros é obrigatório para controle ativo")).toBeDefined();
  });

  it("exibe mensagem quando não há programas cadastrados", () => {
    render(
      <ProgramSection
        programs={[]}
        accounts={[]}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("0 programa(s) cadastrado(s)")).toBeDefined();
    expect(screen.getByText("Nenhum programa cadastrado")).toBeDefined();
  });
});
