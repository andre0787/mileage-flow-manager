import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Users, Wallet } from "lucide-react";
import { HeroStatCard } from "../../src/components/dashboard/HeroStatCard";
import { StockCards } from "../../src/components/dashboard/StockCards";
import { OwnerStockList } from "../../src/components/dashboard/OwnerStockList";
import { RecentSalesList } from "../../src/components/dashboard/RecentSalesList";
import { RecentTransfersList } from "../../src/components/dashboard/RecentTransfersList";
import { AccountCard } from "../../src/components/accounts/AccountCard";
import { AccountsSummary } from "../../src/components/accounts/AccountsSummary";
import type { Account } from "../../src/types";

const mockAccount: Account = {
  id: "acc-1",
  name: "LATAM Pass",
  ownerId: "own-1",
  programId: "prog-1",
  type: "milhas",
  balance: 10000,
  averageCostPerMile: 0.05,
  totalInvested: 500,
  status: "ativa",
  createdAt: "2026-01-01",
};

describe("HeroStatCard", () => {
  it("renderiza label e valor formatado", () => {
    render(
      <HeroStatCard
        icon={Wallet}
        label="Custo médio/milha"
        value={{ value: 0.1234, prefix: "R$ ", format: "fixed3" }}
        iconColor="text-teal"
        valueColor="text-teal"
      />,
    );
    expect(screen.getByText("Custo médio/milha")).toBeDefined();
    expect(screen.getByText("R$ 0.123")).toBeDefined();
  });

  it("renderiza percentual quando format=percent1", () => {
    render(
      <HeroStatCard
        icon={Users}
        label="Margem"
        value={{ value: 12.345, format: "percent1" }}
        iconColor="text-success"
        valueColor="text-success"
      />,
    );
    expect(screen.getByText("12.3%")).toBeDefined();
  });
});

describe("StockCards", () => {
  const data = {
    label: "Milhas em Estoque",
    value: "10.000 milhas",
    iconClass: "bg-primary/10 text-primary",
    accentClass: "from-primary/60 via-gold/40 to-primary/30",
    rows: [
      {
        label: "Saldo total",
        value: "10.000",
        rowClass: "bg-primary/5",
        valueClass: "text-primary",
      },
      { label: "Total investido", value: "R$ 500", rowClass: "bg-gold/5", valueClass: "text-gold" },
    ],
  };

  it("renderiza ambos os cards com labels e valores", () => {
    render(<StockCards milhas={data} pontos={{ ...data, label: "Pontos em Estoque" }} />);
    expect(screen.getByText("Milhas em Estoque")).toBeDefined();
    expect(screen.getByText("Pontos em Estoque")).toBeDefined();
    expect(screen.getAllByText("Saldo total")).toHaveLength(2);
    expect(screen.getAllByText("Total investido")).toHaveLength(2);
    expect(screen.getAllByText("10.000")).toHaveLength(2);
  });
});

describe("OwnerStockList", () => {
  const ownerData = [
    {
      owner: "Ana",
      programs: ["LATAM Pass"],
      totalMiles: 100000,
      totalInvested: 5000,
      avgCost: 0.05,
      cpfCount: 3,
      maxCpf: 22,
    },
  ];

  it("renderiza dono, milhas e investimento", () => {
    render(
      <OwnerStockList
        ownerData={ownerData}
        unitLabel="milhas"
        emptyTitle="Nenhum dono"
        emptyDescription="Crie uma conta"
        icon={Users}
        title="Estoque por Dono"
      />,
    );
    expect(screen.getByText("Ana")).toBeDefined();
    expect(screen.getByText(/100.000 milhas/)).toBeDefined();
  });

  it("renderiza badge de CPF apenas com showCpfBadge", () => {
    const { rerender } = render(
      <OwnerStockList
        ownerData={ownerData}
        unitLabel="milhas"
        showCpfBadge
        emptyTitle="Nenhum dono"
        emptyDescription="Crie uma conta"
        icon={Users}
        title="Estoque por Dono"
      />,
    );
    expect(screen.getByText(/CPFs: 3\/22/)).toBeDefined();

    rerender(
      <OwnerStockList
        ownerData={ownerData}
        unitLabel="pontos"
        emptyTitle="Nenhum dono"
        emptyDescription="Crie uma conta"
        icon={Users}
        title="Estoque por Dono"
      />,
    );
    expect(screen.queryByText(/CPFs: 3\/22/)).toBeNull();
  });

  it("mostra empty state quando sem dados", () => {
    render(
      <OwnerStockList
        ownerData={[]}
        unitLabel="milhas"
        emptyTitle="Nenhum dono com estoque"
        emptyDescription="Crie uma conta e registre entradas"
        icon={Users}
        title="Estoque por Dono"
      />,
    );
    expect(screen.getByText("Nenhum dono com estoque")).toBeDefined();
  });
});

describe("RecentSalesList", () => {
  it("renderiza venda com status e empty state", () => {
    const { rerender } = render(
      <RecentSalesList
        recentSales={[
          {
            id: "s1",
            owner: "Ana",
            client: "João",
            program: "LATAM",
            miles: 50000,
            value: 3500,
            status: "Pago",
            statusColor: "secondary",
          },
        ]}
      />,
    );
    expect(screen.getByText("João")).toBeDefined();
    expect(screen.getByText("Pago")).toBeDefined();

    rerender(<RecentSalesList recentSales={[]} />);
    expect(screen.getByText("Nenhuma venda registrada")).toBeDefined();
  });
});

describe("RecentTransfersList", () => {
  it("renderiza transferência com bônus e empty state", () => {
    const { rerender } = render(
      <RecentTransfersList
        recentTransfers={[
          {
            id: "t1",
            date: "2026-08-10",
            sourceAccountName: "Smiles Pontos",
            pointsDebited: 50000,
            bonusPercent: 30,
            milesReceived: 65000,
            destAccountName: "Smiles Milhas",
          },
        ]}
      />,
    );
    expect(screen.getByText("Smiles Pontos")).toBeDefined();
    expect(screen.getByText(/\+30% bônus/)).toBeDefined();

    rerender(<RecentTransfersList recentTransfers={[]} />);
    expect(screen.getByText("Nenhuma transferência")).toBeDefined();
  });
});

describe("AccountCard", () => {
  it("renderiza saldo calculado, dono e ações", () => {
    render(
      <AccountCard
        account={mockAccount}
        computedBalance={9000}
        ownerName="Ana"
        programName="LATAM Pass"
        unreadCount={2}
        lastEntryDate="2026-08-01"
        lastSaleDate="2026-08-05"
        recalcPending={false}
        onToggleStatus={() => {}}
        onEdit={() => {}}
        onRecalc={() => {}}
        onDelete={() => {}}
        onOpenAlerts={() => {}}
      />,
    );
    expect(screen.getAllByText("LATAM Pass")).toHaveLength(2); // nome + programa
    expect(screen.getByText("9.000")).toBeDefined();
    expect(screen.getByText("Ana")).toBeDefined();
    expect(screen.getByText("Desativar")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined(); // badge de alertas
  });

  it("indica divergência de saldo registrado", () => {
    render(
      <AccountCard
        account={mockAccount}
        computedBalance={9000}
        ownerName="Ana"
        programName="LATAM Pass"
        unreadCount={0}
        recalcPending={false}
        onToggleStatus={() => {}}
        onEdit={() => {}}
        onRecalc={() => {}}
        onDelete={() => {}}
        onOpenAlerts={() => {}}
      />,
    );
    expect(screen.getByText("Saldo registrado:")).toBeDefined();
    expect(screen.getByText("10.000")).toBeDefined();
  });
});

describe("AccountsSummary", () => {
  it("renderiza totais de contas, ativas, pontos e milhas", () => {
    const balances = new Map<string, number>([["acc-1", 9000]]);
    render(<AccountsSummary accounts={[mockAccount]} computedBalances={balances} />);
    expect(screen.getByText("Resumo das Contas")).toBeDefined();
    expect(screen.getByText("Total de Contas")).toBeDefined();
    expect(screen.getByText("Contas Ativas")).toBeDefined();
    expect(screen.getByText("Total Milhas")).toBeDefined();
    expect(screen.getByText("Total Pontos")).toBeDefined();
    expect(screen.getByText("9.000")).toBeDefined();
  });
});
