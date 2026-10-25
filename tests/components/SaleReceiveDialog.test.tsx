import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaleReceiveDialog } from "@/components/sales/SaleReceiveDialog";
import type { ClientCredit } from "@/types";

describe("SaleReceiveDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    saleValue: 1000,
    amountReceived: 200,
    clientBalance: 500,
    clientName: "João Silva",
    saleMovements: [] as ClientCredit[],
    onConfirm: vi.fn(),
  };

  it("renderiza o resumo e campos de entrada corretamente", () => {
    render(<SaleReceiveDialog {...defaultProps} />);

    expect(screen.getByText("Registrar recebimento")).toBeDefined();
    expect(screen.getByText("R$ 1000.00")).toBeDefined();
    expect(screen.getByText("R$ 200.00")).toBeDefined();
    expect(screen.getByText("R$ 800.00")).toBeDefined();
    expect(screen.getByText("R$ 500.00")).toBeDefined();
    expect(screen.getByText("Caixa 1 · Dinheiro novo")).toBeDefined();
    expect(screen.getByText("Caixa 2 · Crédito atual")).toBeDefined();
  });

  it("permite selecionar e informar pagamento com crédito", () => {
    render(<SaleReceiveDialog {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", { name: "Pagar com crédito" });
    fireEvent.click(checkbox);

    const creditInput = screen.getByRole("spinbutton", { name: "Usar saldo de crédito" });
    fireEvent.change(creditInput, { target: { value: "300" } });

    expect(screen.getByText(/Usando R\$ 300.00 do saldo/i)).toBeDefined();
  });

  it("chama onConfirm com os valores de caixa e crédito ao confirmar", () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SaleReceiveDialog {...defaultProps} onConfirm={onConfirm} onOpenChange={onOpenChange} />,
    );

    const confirmBtn = screen.getByRole("button", { name: "Confirmar recebimento" });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith({ cash: 800, useCredit: 0 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("exibe recibos da venda no extrato quando fornecidos", () => {
    const movements: ClientCredit[] = [
      {
        id: "m-1",
        clientId: "c-1",
        saleId: "s-1",
        amount: 150,
        kind: "earn",
        createdAt: "2025-01-01",
      },
      {
        id: "m-2",
        clientId: "c-1",
        saleId: "s-1",
        amount: 50,
        kind: "spend",
        createdAt: "2025-01-02",
      },
      {
        id: "m-3",
        clientId: "c-1",
        saleId: "s-1",
        amount: 25,
        kind: "reversal",
        reversalOf: "spend",
        createdAt: "2025-01-03",
      },
    ];

    render(<SaleReceiveDialog {...defaultProps} saleMovements={movements} />);

    expect(screen.getByText("Recibos desta venda")).toBeDefined();
    expect(screen.getByText("Crédito gerado: +R$ 150.00")).toBeDefined();
    expect(screen.getByText("Crédito usado: −R$ 50.00")).toBeDefined();
    expect(screen.getByText("Estorno (devolução): +R$ 25.00")).toBeDefined();
  });
});
