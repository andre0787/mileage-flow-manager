import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const alertas = [
  {
    id: "al-1",
    accountId: "acc-1",
    userId: "u-1",
    date: "2026-08-10",
    observation: "Renovar clube",
    read: false,
    createdAt: "2026-08-07",
  },
];

vi.mock("@/hooks/useDatabase", () => ({
  useAccountAlerts: () => ({ data: alertas, isLoading: false }),
  useAddAccountAlertMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleAccountAlertMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe("AccountAlertsDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista alertas da conta com data e observação", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByText("Renovar clube")).toBeDefined();
    expect(screen.getByText(/10\/08\/2026/)).toBeDefined();
  });

  it("mostra badge de não lido", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByText("Não lido")).toBeDefined();
  });

  it("renderiza form com data e observação", () => {
    render(<AccountAlertsDialog account={account} open onOpenChange={() => {}} />);
    expect(screen.getByLabelText("Data")).toBeDefined();
    expect(screen.getByLabelText("Observação")).toBeDefined();
  });
});
