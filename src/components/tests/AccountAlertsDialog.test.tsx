import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { AccountAlertsDialog } from "@/components/AccountAlertsDialog";
import type { Account } from "@/types";

const account: Account = {
  id: "acc-1",
  name: "Conta Teste",
  ownerId: "own-1",
  programId: "prog-1",
  type: "milhas",
  balance: 1000,
  status: "ativa",
  createdAt: "2026-01-01",
};

const mockAlerts = [
  {
    id: "al-1",
    accountId: "acc-1",
    userId: "u-1",
    date: "2026-08-10",
    observation: "Renovar clube",
    read: false,
    createdAt: "2026-08-07",
  },
  {
    id: "al-2",
    accountId: "acc-2",
    userId: "u-1",
    date: "2026-08-12",
    observation: "Outra conta",
    read: true,
    createdAt: "2026-08-07",
  },
];

const mockAddMutate = vi.fn();
const mockToggleMutate = vi.fn();
let mockIsPending = false;
let mockCurrentAlerts = mockAlerts;

vi.mock("@/hooks/useDatabase", () => ({
  useAccountAlerts: () => ({ data: mockCurrentAlerts, isLoading: false }),
  useAddAccountAlertMutation: () => ({ mutate: mockAddMutate, isPending: mockIsPending }),
  useToggleAccountAlertMutation: () => ({ mutate: mockToggleMutate, isPending: false }),
}));

describe("AccountAlertsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockCurrentAlerts = mockAlerts;
  });

  it("lista alertas da conta e oculta alertas de outras contas", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Renovar clube")).toBeDefined();
    expect(screen.getByText(/10\/08\/2026/)).toBeDefined();
    expect(screen.queryByText("Outra conta")).toBeNull();
  });

  it("exibe mensagem quando não há alertas para a conta", () => {
    mockCurrentAlerts = [];
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Nenhum alerta para esta conta.")).toBeDefined();
  });

  it("exibe badge de status de leitura correto", () => {
    mockCurrentAlerts = [
      { ...mockAlerts[0], read: false },
      { ...mockAlerts[0], id: "al-3", observation: "Lembrete lido", read: true },
    ];
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Não lido")).toBeDefined();
    expect(screen.getAllByText("Lida").length).toBeGreaterThan(0);
  });

  it("valida desabilitação do botão Adicionar Alerta", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Adicionar alerta" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-09-01" } });
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Observação"), { target: { value: "   " } });
    expect(button.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Observação"), { target: { value: "Valido" } });
    expect(button.disabled).toBe(false);
  });

  it("desabilita botão de adicionar quando mutation está pendente", () => {
    mockIsPending = true;
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Observação"), { target: { value: "Valido" } });
    const button = screen.getByRole("button", { name: "Adicionar alerta" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("submete novo alerta e reseta os campos no onSuccess", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    const dateInput = screen.getByLabelText("Data") as HTMLInputElement;
    const obsInput = screen.getByLabelText("Observação") as HTMLInputElement;

    fireEvent.change(dateInput, { target: { value: "2026-09-01" } });
    fireEvent.change(obsInput, { target: { value: "Renovar clube" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar alerta" }));

    expect(mockAddMutate).toHaveBeenCalledWith(
      { accountId: "acc-1", date: "2026-09-01", observation: "Renovar clube" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    const [, options] = mockAddMutate.mock.calls[0];
    act(() => {
      options.onSuccess();
    });

    expect(dateInput.value).toBe("");
    expect(obsInput.value).toBe("");
  });

  it("alterna status de leitura do alerta", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={vi.fn()} />);
    const switchEl = screen.getByRole("switch", { name: "Marcar alerta como lida" });
    fireEvent.click(switchEl);

    expect(mockToggleMutate).toHaveBeenCalledWith({ id: "al-1", read: true });
  });
});
