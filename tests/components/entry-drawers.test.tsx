import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EntryOrigemTypeDrawer } from "../../src/components/entry/EntryOrigemTypeDrawer";
import { EntryOwnerDrawer } from "../../src/components/entry/EntryOwnerDrawer";
import { EntryProgramDrawer } from "../../src/components/entry/EntryProgramDrawer";
import { AccountDrawerFields } from "../../src/components/entry/AccountDrawerFields";
import { DashboardAlertBanners } from "../../src/components/dashboard/DashboardAlertBanners";
import { DashboardSecondaryMetrics } from "../../src/components/dashboard/DashboardSecondaryMetrics";
import { DashboardSkeleton } from "../../src/components/dashboard/DashboardSkeleton";
import type { Owner, Program } from "../../src/types";

const mockOwners: Owner[] = [
  { id: "own-1", name: "Ana", cpf: "", phone: "" },
  { id: "own-2", name: "Bruno", cpf: "", phone: "" },
];

const mockPrograms: Program[] = [
  { id: "prog-1", name: "LATAM Pass", type: "milhas" },
  { id: "prog-2", name: "Smiles", type: "pontos" },
];

describe("EntryOrigemTypeDrawer", () => {
  it("valida nome obrigatório", () => {
    const onCreate = vi.fn().mockResolvedValue("ot-1");
    render(
      <EntryOrigemTypeDrawer
        open
        onOpenChange={() => {}}
        type="milhas"
        onCreated={() => {}}
        onCreate={onCreate}
      />,
    );
    fireEvent.click(screen.getByText("Cadastrar"));
    expect(screen.getByText("Nome é obrigatório")).toBeDefined();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("cria origem com nome e chama onCreated", async () => {
    const onCreate = vi.fn().mockResolvedValue("ot-1");
    const onCreated = vi.fn();
    render(
      <EntryOrigemTypeDrawer
        open
        onOpenChange={() => {}}
        type="milhas"
        onCreated={onCreated}
        onCreate={onCreate}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Ex: Compra Direta"), {
      target: { value: "Compra Direta" },
    });
    fireEvent.click(screen.getByText("Cadastrar"));
    expect(await screen.findByText("Cadastrar")).toBeDefined();
    expect(onCreate).toHaveBeenCalledWith({
      name: "Compra Direta",
      color: "#10b981",
      hasRecurrence: false,
    });
    expect(onCreated).toHaveBeenCalledWith("ot-1");
  });
});

describe("EntryOwnerDrawer", () => {
  it("cria dono com nome", async () => {
    const onCreate = vi.fn().mockResolvedValue("own-9");
    const onCreated = vi.fn();
    render(
      <EntryOwnerDrawer open onOpenChange={() => {}} onCreated={onCreated} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByPlaceholderText("Ex: João Silva"), {
      target: { value: "Carlos" },
    });
    fireEvent.click(screen.getByText("Cadastrar"));
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: "Carlos", cpf: undefined, phone: undefined });
      expect(onCreated).toHaveBeenCalledWith("own-9");
    });
  });
});

describe("EntryProgramDrawer", () => {
  it("cria programa com tipo milhas", async () => {
    const onCreate = vi.fn().mockResolvedValue("prog-9");
    const onCreated = vi.fn();
    render(
      <EntryProgramDrawer open onOpenChange={() => {}} onCreated={onCreated} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByPlaceholderText("Ex: LATAM Pass"), {
      target: { value: "Azul Fidelidade" },
    });
    fireEvent.click(screen.getByText("Cadastrar"));
    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: "Azul Fidelidade", type: "pontos" });
      expect(onCreated).toHaveBeenCalledWith("prog-9");
    });
  });
});

describe("AccountDrawerFields", () => {
  it("renderiza donos e programas e valida tipo da conta", () => {
    render(
      <AccountDrawerFields
        value={{ name: "Conta X", ownerId: "own-1", programId: "prog-1" }}
        onChange={() => {}}
        errors={{}}
        owners={mockOwners}
        programs={mockPrograms}
        onOpenOwner={() => {}}
        onOpenProgram={() => {}}
      />,
    );
    expect(screen.getByText("Ana")).toBeDefined();
    expect(screen.getByText(/LATAM Pass \(Milhas\)/)).toBeDefined();
    expect(screen.getByText("Tipo da conta:")).toBeDefined();
    expect(screen.getByText("Milhas")).toBeDefined();
  });
});

describe("DashboardAlertBanners", () => {
  it("renderiza apenas banners com contagem > 0", () => {
    const { rerender } = render(
      <DashboardAlertBanners
        overdueCount={2}
        pendingCount={0}
        activeTab="milhas"
        onViewEntries={() => {}}
      />,
    );
    expect(screen.getByText(/2 entradas atrasadas/)).toBeDefined();
    expect(screen.queryByText(/pendente/)).toBeNull();

    rerender(
      <DashboardAlertBanners
        overdueCount={0}
        pendingCount={1}
        activeTab="pontos"
        onViewEntries={() => {}}
      />,
    );
    expect(screen.getByText(/1 entrada pendente/)).toBeDefined();
    expect(screen.queryByText(/atrasada/)).toBeNull();
  });
});

describe("DashboardSecondaryMetrics", () => {
  const metrics = {
    totalMiles: 1000,
    totalInvested: 500,
    monthlyRevenue: 100,
    monthlyProfit: 20,
    activeAccounts: 3,
    pendingSales: 1,
    cpfAlerts: 0,
    totalSoldMiles: 200,
    totalRevenue: 300,
    totalProfit: 60,
    avgProfitMargin: 20,
    avgCostPerMile: 0.5,
    monthlyMilesIn: 50,
    revenueChange: 10,
  };

  it("variante milhas mostra 3 cards; pontos mostra apenas Contas Ativas", () => {
    const { rerender } = render(<DashboardSecondaryMetrics metrics={metrics} variant="milhas" />);
    expect(screen.getByText("Contas Ativas")).toBeDefined();
    expect(screen.getByText("Vendas Pendentes")).toBeDefined();
    expect(screen.getByText("Alertas CPF")).toBeDefined();

    rerender(<DashboardSecondaryMetrics metrics={metrics} variant="pontos" />);
    expect(screen.getByText("Contas Ativas (Pontos)")).toBeDefined();
    expect(screen.queryByText("Vendas Pendentes")).toBeNull();
  });
});

describe("DashboardSkeleton", () => {
  it("renderiza esqueletos de loading", () => {
    render(<DashboardSkeleton />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
