import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SaleForm } from "@/components/SaleForm";
import { ClientCreationDrawer } from "@/components/ClientCreationDrawer";

describe("ClientCreationDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe mensagem de erro quando o nome está vazio", async () => {
    const onCreateClient = vi.fn().mockResolvedValue(undefined);
    const onClientCreated = vi.fn();

    render(
      <ClientCreationDrawer
        open={true}
        onOpenChange={vi.fn()}
        onCreateClient={onCreateClient}
        onClientCreated={onClientCreated}
      />
    );

    expect(screen.getByText("Novo Cliente")).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Nome é obrigatório")).toBeDefined();
    expect(onCreateClient).not.toHaveBeenCalled();
  });

  it("chama onCreateClient e onClientCreated ao preencher nome e cadastrar", async () => {
    const onCreateClient = vi.fn().mockResolvedValue(undefined);
    const onClientCreated = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ClientCreationDrawer
        open={true}
        onOpenChange={onOpenChange}
        onCreateClient={onCreateClient}
        onClientCreated={onClientCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText("Digite o nome completo");
    fireEvent.change(nameInput, { target: { value: "Maria Silva" } });

    const submitBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria Silva",
        })
      );
      expect(onClientCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria Silva",
        })
      );
    });
  });
});

describe("SaleForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    accounts: [],
    owners: [],
    programs: [],
    clients: [],
    sales: [],
    onSubmit: vi.fn(),
    onCreateClient: vi.fn().mockResolvedValue(undefined),
  };

  it("renderiza o formulário de venda no modo criação", () => {
    render(<SaleForm {...mockProps} />);
    expect(screen.getByText("Registrar Nova Venda")).toBeDefined();
    expect(screen.getByRole("button", { name: "Milhas" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Serviço" })).toBeDefined();
  });

  it("renderiza o formulário no modo edição", () => {
    render(<SaleForm {...mockProps} mode="edit" />);
    expect(screen.getByText("Editar Venda")).toBeDefined();
  });

  it("abre a gaveta de novo cliente ao clicar no botão de adicionar cliente", () => {
    render(<SaleForm {...mockProps} />);
    const addClientBtn = screen.getByTitle("Novo cliente");
    fireEvent.click(addClientBtn);
    expect(screen.getByText("Novo Cliente")).toBeDefined();
  });
});
