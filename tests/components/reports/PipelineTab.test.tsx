import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PipelineTab } from "@/components/reports/PipelineTab";

describe("PipelineTab", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders section title and observation note with empty data", () => {
    render(<PipelineTab entries={[]} sales={[]} />);

    expect(screen.getByText("Pipeline operacional")).toBeDefined();
    expect(
      screen.getByText("WIP é só-observação (sem limites bloqueantes)"),
    ).toBeDefined();

    expect(screen.getByText("Aguardando")).toBeDefined();
    expect(screen.getByText("Comprado")).toBeDefined();
    expect(screen.getByText("Vendido · a executar")).toBeDefined();
    expect(screen.getByText("A receber")).toBeDefined();
    expect(screen.getByText("Recebido")).toBeDefined();
    expect(screen.getByText("Cancelado (lateral)")).toBeDefined();

    expect(screen.queryByText(/vencendo em/i)).toBeNull();
    expect(screen.queryByText(/venda\(s\) de serviço fora do WIP/i)).toBeNull();
  });

  it("renders WIP counts correctly for entries and sales", () => {
    const mockEntries = [
      { accountId: "acc1", amountPaid: 50, amount: 100 },
      { accountId: "acc2", amountPaid: 100, amount: 100 },
      { accountId: "acc3", amountPaid: 200, amount: 150 },
    ];

    const mockSales = [
      { status: "pendente", date: "2025-06-10", kind: "milhas", accountId: "acc1" },
      { status: "pago", date: "2025-05-01", kind: "milhas", accountId: "acc1" },
      { status: "concluido", date: "2025-06-01", kind: "milhas", accountId: "acc2" },
      { status: "cancelado", date: "2025-06-02", kind: "milhas", accountId: "acc2" },
    ];

    render(<PipelineTab entries={mockEntries} sales={mockSales} />);

    // aguardando: 1, comprado: 2, aExecutar: 1, aReceber: 1, recebido: 1, cancelado: 1
    const aguardandoCard = screen.getByText("Aguardando").parentElement;
    const compradoCard = screen.getByText("Comprado").parentElement;
    const aExecutarCard = screen.getByText("Vendido · a executar").parentElement;
    const aReceberCard = screen.getByText("A receber").parentElement;
    const recebidoCard = screen.getByText("Recebido").parentElement;
    const canceladoCard = screen.getByText("Cancelado (lateral)").parentElement;

    expect(aguardandoCard?.querySelector(".font-display")?.textContent).toBe("1");
    expect(compradoCard?.querySelector(".font-display")?.textContent).toBe("2");
    expect(aExecutarCard?.querySelector(".font-display")?.textContent).toBe("1");
    expect(aReceberCard?.querySelector(".font-display")?.textContent).toBe("1");
    expect(recebidoCard?.querySelector(".font-display")?.textContent).toBe("1");
    expect(canceladoCard?.querySelector(".font-display")?.textContent).toBe("1");
  });

  it("shows expedite notice when a sale is due in 7 days or less", () => {
    const mockSales = [
      { status: "pago", date: "2025-05-20", kind: "milhas" },
    ];

    render(<PipelineTab entries={[]} sales={mockSales} />);

    expect(screen.getByText("1 vencendo em ≤ 7 dias")).toBeDefined();
  });

  it("shows service sales notice when kind is servico", () => {
    const mockSales = [
      { status: "pendente", date: "2025-06-10", kind: "servico" },
      { status: "pago", date: "2025-06-10", kind: "servico" },
    ];

    render(<PipelineTab entries={[]} sales={mockSales} />);

    expect(
      screen.getByText("2 venda(s) de serviço fora do WIP de milhas."),
    ).toBeDefined();
  });
});
