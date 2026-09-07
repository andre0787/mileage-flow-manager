import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountsTable, type AccountsTableRow } from "@/components/accounts/AccountsTable";
import type { Account } from "@/types";

const account = (id: string, name: string, totalInvested?: number): Account => ({
  id,
  name,
  ownerId: "owner-1",
  programId: "prog-1",
  type: "pontos",
  balance: 1000,
  status: "ativa",
  createdAt: "2026-01-01",
  totalInvested,
});

const row = (
  id: string,
  name: string,
  overrides: Partial<AccountsTableRow> = {},
  totalInvested?: number,
): AccountsTableRow => ({
  account: account(id, name, totalInvested),
  computedBalance: 1000,
  receivable: 0,
  ownerName: "Ana",
  ownerColorHex: null,
  programName: "Smiles",
  unreadCount: 0,
  ...overrides,
});

const base = {
  sort: null,
  onSort: vi.fn(),
  totals: { count: 2, saldo: 2000, investido: 100, receber: 0, avgUnit: 0.05 },
  recalcPending: false,
  onToggleStatus: vi.fn(),
  onEdit: vi.fn(),
  onRecalc: vi.fn(),
  onDelete: vi.fn(),
  onOpenAlerts: vi.fn(),
};

describe("AccountsTable — ordenação em todas as colunas + média/un", () => {
  it("todas as colunas de dados são ordenáveis (cabeçalho dispara onSort)", () => {
    render(<AccountsTable {...base} rows={[row("1", "A"), row("2", "B")]} />);
    for (const label of ["Conta", "Programa", "Dono", "Média/un", "Saldo", "Investido", "A receber", "Status"]) {
      fireEvent.click(screen.getByText(label));
    }
    expect(base.onSort).toHaveBeenCalledTimes(8);
    // Último clique: Status
    const keys = vi.mocked(base.onSort).mock.calls.map((c) => (c[0] as { key: string }).key);
    expect(keys).toEqual(["conta", "programa", "dono", "media", "saldo", "investido", "receber", "status"]);
  });

  it("coluna Média/un renderiza valor com 4 casas e '—' sem dado", () => {
    render(
      <AccountsTable
        {...base}
        rows={[
          row("1", "Com investimento", { avgUnitCost: 0.0234 }, 50),
          row("2", "Sem investimento", {}),
        ]}
      />,
    );
    expect(screen.getByText("R$ 0,0234")).toBeTruthy();
    // Sem totalInvested → sem média
    const cells = screen.getAllByText("—");
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("rodapé mostra a média ponderada", () => {
    render(<AccountsTable {...base} rows={[row("1", "A")]} />);
    expect(screen.getByText("R$ 0,0500")).toBeTruthy();
  });
});
