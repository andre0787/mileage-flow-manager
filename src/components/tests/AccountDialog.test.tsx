import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AccountDialog from "@/components/AccountDialog";

vi.mock("@/contexts/DataContext", () => ({
  useData: () => ({
    owners: [{ id: "o1", name: "Dono 1" }],
    programs: [
      { id: "p1", name: "LATAM Pass", type: "milhas" },
      { id: "p2", name: "Livelo", type: "pontos" },
    ],
  }),
}));

vi.mock("@/hooks/useDatabase", () => ({
  useAddOwnerMutation: () => ({ mutate: vi.fn() }),
  useAddProgramMutation: () => ({ mutate: vi.fn() }),
  useAddAccountMutation: () => ({ mutate: vi.fn() }),
  useUpdateAccountMutation: () => ({ mutate: vi.fn() }),
}));

describe("AccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza título e campos no modo create", () => {
    render(<AccountDialog mode="create" open onOpenChange={() => {}} />);
    expect(screen.getByText("Criar Nova Conta")).toBeDefined();
    expect(screen.getByLabelText("Nome da Conta")).toBeDefined();
    expect(screen.getByLabelText("Saldo Inicial")).toBeDefined();
    expect(screen.getByRole("button", { name: "Criar Conta" })).toBeDefined();
  });

  it("renderiza título no modo edit", () => {
    render(<AccountDialog mode="edit" open onOpenChange={() => {}} />);
    expect(screen.getByText("Editar Conta")).toBeDefined();
  });

  it("chama onOpenChange ao cancelar", () => {
    const onOpenChange = vi.fn();
    render(<AccountDialog mode="create" open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("exibe mensagem de erro quando tenta salvar sem selecionar programa", () => {
    render(<AccountDialog mode="create" open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Criar Conta" }));
    expect(screen.getByText("Selecione um programa")).toBeDefined();
  });

  it("abre sub-diálogo de novo dono ao clicar no botão de adicionar", () => {
    render(<AccountDialog mode="create" open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo dono" }));
    expect(screen.getByText("Novo Dono")).toBeDefined();
  });

  it("abre sub-diálogo de novo programa ao clicar no botão de adicionar", () => {
    render(<AccountDialog mode="create" open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo programa" }));
    expect(screen.getByText("Novo Programa")).toBeDefined();
  });
});
