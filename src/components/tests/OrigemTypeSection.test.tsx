import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OrigemTypeSection from "@/components/OrigemTypeSection";
import type { OrigemType, PointEntry } from "@/types";

const mockOrigemTypes: OrigemType[] = [
  {
    id: "ot-1",
    name: "Compra Direta",
    accountType: "milhas",
    color: "#10b981",
    description: "Recorrência: Não",
  },
  {
    id: "ot-2",
    name: "Clube Livelo",
    accountType: "milhas",
    color: "#3b82f6",
    description: "Recorrência: Sim",
  },
];

const mockEntries: PointEntry[] = [
  {
    id: "entry-1",
    accountId: "acc-1",
    origemTypeId: "ot-1",
    amount: 1000,
    amountPaid: 20,
    costPerThousand: 20,
    date: "2025-01-01",
  },
];

describe("OrigemTypeSection", () => {
  it("renderiza a lista de tipos de operação e o total cadastrado", () => {
    render(
      <OrigemTypeSection
        origemTypes={mockOrigemTypes}
        entries={mockEntries}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("2 tipo(s) de operação cadastrado(s)")).toBeDefined();
    expect(screen.getAllByText("Compra Direta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Clube Livelo").length).toBeGreaterThan(0);
  });

  it("abre o diálogo para criar nova operação ao clicar em 'Nova Operação'", () => {
    render(
      <OrigemTypeSection
        origemTypes={mockOrigemTypes}
        entries={mockEntries}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /Nova Operação/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole("heading", { name: "Nova Operação" })).toBeDefined();
  });

  it("chama onAdd com os dados corretos ao cadastrar uma nova operação", () => {
    const handleAdd = vi.fn();
    render(
      <OrigemTypeSection
        origemTypes={mockOrigemTypes}
        entries={mockEntries}
        onAdd={handleAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /Nova Operação/i });
    fireEvent.click(newBtn);

    const nameInput = screen.getByPlaceholderText("Ex: Compra Direta");
    fireEvent.change(nameInput, { target: { value: "Cartão de Crédito" } });

    const submitBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(submitBtn);

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Cartão de Crédito",
        accountType: "milhas",
        color: "#10b981",
      }),
    );
  });

  it("exibe validação de erro ao tentar cadastrar sem nome", () => {
    const handleAdd = vi.fn();
    render(
      <OrigemTypeSection
        origemTypes={[]}
        entries={[]}
        onAdd={handleAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const newBtn = screen.getByRole("button", { name: /Nova Operação/i });
    fireEvent.click(newBtn);

    const submitBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Nome é obrigatório")).toBeDefined();
    expect(handleAdd).not.toHaveBeenCalled();
  });

  it("desabilita botão de exclusão quando há entradas vinculadas ao tipo de operação", () => {
    render(
      <OrigemTypeSection
        origemTypes={mockOrigemTypes}
        entries={mockEntries}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg.lucide-trash2")) as HTMLButtonElement[];
    expect(deleteButtons.length).toBeGreaterThan(0);
    expect(deleteButtons[0].disabled).toBe(true);
  });
});
