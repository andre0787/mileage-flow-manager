import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientCreationDrawer } from "@/components/ClientCreationDrawer";
import { SaleForm } from "@/components/SaleForm";
import type { Account, Client, Owner, Program, Sale } from "@/types";

const mockAccounts: Account[] = [
  {
    id: "acc-1",
    ownerId: "owner-1",
    programId: "prog-1",
    name: "Conta 1",
    type: "milhas",
    status: "ativa",
    balance: 100000,
    averageCostPerMile: 0.02,
  },
];

const mockOwners: Owner[] = [{ id: "owner-1", name: "João Silva" }];

const mockPrograms: Program[] = [
  {
    id: "prog-1",
    name: "Smiles",
    maxPassengers: 2,
    passengerCycleType: "annual",
    passengerCycleDays: 365,
  },
];

const mockClients: Client[] = [
  {
    id: "client-1",
    name: "Maria Souza",
    cpf: "123.456.789-00",
  },
];

const mockSales: Sale[] = [
  {
    id: "sale-1",
    ownerName: "João Silva",
    accountId: "acc-1",
    accountName: "Conta 1",
    program: "Smiles",
    clientId: "client-1",
    clientName: "Maria Souza",
    milesUsed: 10000,
    pricePerMile: 0.03,
    saleValue: 300,
    costPerMile: 0.02,
    profit: 100,
    profitMargin: 33.3,
    date: "2025-01-01",
    status: "confirmado",
    passengers: [
      { name: "Passageiro Existente 1", passengerId: "p-ex-1", cpf: "" },
      { name: "Passageiro Existente 2", passengerId: "p-ex-2", cpf: "" },
    ],
  },
];

describe("SaleForm", () => {
  it("permite selecionar o cliente do passageiro via handlePassengerClientChange", () => {
    render(
      <SaleForm
        open={true}
        onOpenChange={vi.fn()}
        accounts={mockAccounts}
        owners={mockOwners}
        programs={mockPrograms}
        clients={mockClients}
        sales={[]}
        onSubmit={vi.fn()}
        onCreateClient={vi.fn()}
        initialData={{
          ownerName: "João Silva",
          accountId: "acc-1",
          accountName: "Conta 1",
          program: "Smiles",
          clientId: "client-1",
          clientName: "Maria Souza",
          milesUsed: "10000",
          pricePerMile: "0.03",
          saleValue: "300.00",
          additionalCost: "",
          additionalCostDesc: "",
          kind: "milhas",
          date: "2025-01-01",
          ticketLocator: "ABC123",
          passengers: [{ name: "", passengerId: "p1", cpf: "" }],
        }}
      />,
    );

    const inputs = screen.getAllByPlaceholderText("Nome completo");
    expect(inputs.length).toBe(1);
  });

  it("renderiza o formulário nos modos milhas e serviço", () => {
    render(
      <SaleForm
        open={true}
        onOpenChange={vi.fn()}
        accounts={mockAccounts}
        owners={mockOwners}
        programs={mockPrograms}
        clients={mockClients}
        sales={[]}
        onSubmit={vi.fn()}
        onCreateClient={vi.fn()}
        initialData={{
          ownerName: "João Silva",
          accountId: "acc-1",
          accountName: "Conta 1",
          program: "Smiles",
          clientId: "client-1",
          clientName: "Maria Souza",
          milesUsed: "10000",
          pricePerMile: "0.03",
          saleValue: "300.00",
          additionalCost: "",
          additionalCostDesc: "",
          kind: "milhas",
          date: "2025-01-01",
          ticketLocator: "ABC123",
          passengers: [{ name: "", passengerId: "p1", cpf: "" }],
        }}
      />,
    );

    expect(screen.getByRole("group", { name: "Tipo da venda" })).toBeInTheDocument();
    expect(screen.getByText("Dono da Conta")).toBeInTheDocument();

    const servicoBtn = screen.getByRole("button", { name: "Serviço" });
    fireEvent.click(servicoBtn);

    expect(screen.getByText("Tipo de serviço")).toBeInTheDocument();
    expect(screen.queryByText("Dono da Conta")).not.toBeInTheDocument();
  });

  it("calcula excedente de passageiros e desabilita envio quando limite é ultrapassado", () => {
    render(
      <SaleForm
        open={true}
        onOpenChange={vi.fn()}
        accounts={mockAccounts}
        owners={mockOwners}
        programs={mockPrograms}
        clients={mockClients}
        sales={mockSales}
        onSubmit={vi.fn()}
        onCreateClient={vi.fn()}
        initialData={{
          ownerName: "João Silva",
          accountId: "acc-1",
          accountName: "Conta 1",
          program: "Smiles",
          clientId: "client-1",
          clientName: "Maria Souza",
          milesUsed: "10000",
          pricePerMile: "0.03",
          saleValue: "300.00",
          additionalCost: "",
          additionalCostDesc: "",
          kind: "milhas",
          date: "2025-01-01",
          ticketLocator: "ABC123",
          passengers: [{ name: "Novo Passageiro", passengerId: "p1", cpf: "" }],
        }}
      />,
    );

    expect(
      screen.getByText(/Limite de 2 passageiros excedido para este ciclo/),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Registrar Venda" });
    expect(submitBtn).toBeDisabled();
  });
});

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
      />,
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
      />,
    );

    const nameInput = screen.getByPlaceholderText("Digite o nome completo");
    fireEvent.change(nameInput, { target: { value: "Maria Silva" } });

    const submitBtn = screen.getByRole("button", { name: "Cadastrar" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreateClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria Silva",
        }),
      );
      expect(onClientCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Maria Silva",
        }),
      );
    });
  });
});

describe("SaleForm (básico)", () => {
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
