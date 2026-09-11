import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OwnerSection from "@/components/OwnerSection";
import type { Owner, Account } from "@/types";

const mockOwners: Owner[] = [
  {
    id: "owner-1",
    name: "João Silva",
    cpf: "123.456.789-00",
    phone: "(11) 99999-9999",
    color: "#FF0000",
  },
];

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    ownerId: "owner-1",
    programId: "prog-1",
    name: "Conta Azul",
    type: "pontos",
    status: "ativa",
    balance: 10000,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

describe("OwnerSection", () => {
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a quantidade de donos e a lista de donos", () => {
    render(
      <OwnerSection
        owners={mockOwners}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("1 dono(s) cadastrado(s)")).toBeDefined();
    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
  });

  it("abre o diálogo ao clicar em 'Novo Dono' e reseta ao fechar/cancelar", () => {
    render(
      <OwnerSection
        owners={mockOwners}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    const button = screen.getByRole("button", { name: /Novo Dono/i });
    fireEvent.click(button);

    expect(screen.getByText("Nome Completo")).toBeDefined();

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButton);

    expect(screen.queryByText("Nome Completo")).toBeNull();
  });

  it("exibe mensagem de erro ao tentar cadastrar sem nome", () => {
    render(
      <OwnerSection
        owners={mockOwners}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Novo Dono/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(screen.getByText("Nome é obrigatório")).toBeDefined();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("chama onAdd com os dados corretos ao preencher e cadastrar", () => {
    render(
      <OwnerSection
        owners={mockOwners}
        accounts={mockAccounts}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Novo Dono/i }));

    fireEvent.change(screen.getByPlaceholderText("Nome do dono"), {
      target: { value: "Maria Souza" },
    });
    fireEvent.change(screen.getByPlaceholderText("000.000.000-00"), {
      target: { value: "98765432100" },
    });
    fireEvent.change(screen.getByPlaceholderText("(11) 99999-9999"), {
      target: { value: "11988887777" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Maria Souza",
        cpf: "987.654.321-00",
        phone: "11988887777",
      }),
    );
  });
});
