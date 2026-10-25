import confetti from "canvas-confetti";
import { toast } from "sonner";
import { buildCreateSaleInput, buildUpdateSaleInput } from "./vendaFormHelpers";
import type { SaleFormData } from "@/components/SaleForm";
import type { Sale } from "@/types";

interface UseVendasActionsOptions {
  editingSale: Sale | null;
  sales: Sale[];
  addSaleM: { mutate: (payload: unknown, callbacks?: unknown) => void };
  updateSaleM: { mutate: (payload: unknown, callbacks?: unknown) => void };
  receiveWithCreditM: { mutate: (payload: unknown, callbacks?: unknown) => void };
  refundToCreditM: {
    mutateAsync: (payload: { saleId: string; amount: number }) => Promise<{ refunded: number }>;
  };
  haptic: { success: () => void };
  setIsCreateDialogOpen: (open: boolean) => void;
  setIsEditDialogOpen: (open: boolean) => void;
  setEditingSale: (sale: Sale | null) => void;
}

export function useVendasActions({
  editingSale,
  sales,
  addSaleM,
  updateSaleM,
  receiveWithCreditM,
  refundToCreditM,
  haptic,
  setIsCreateDialogOpen,
  setIsEditDialogOpen,
  setEditingSale,
}: UseVendasActionsOptions) {
  const handleCreateSale = (data: SaleFormData) => {
    const payload = buildCreateSaleInput(data);
    addSaleM.mutate(payload, {
      onSuccess: () => {
        haptic.success();
        if (payload.saleValue >= 200) {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#f59e0b", "#10b981"],
          });
        }
      },
      onError: () => toast.error("Erro ao criar venda. Verifique os dados e tente novamente."),
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSale = (data: SaleFormData) => {
    if (!editingSale) return;
    const payload = buildUpdateSaleInput(editingSale, data);
    updateSaleM.mutate(payload, {
      onSuccess: () => haptic.success(),
      onError: () => toast.error("Erro ao atualizar venda. Verifique os dados e tente novamente."),
    });
    setEditingSale(null);
    setIsEditDialogOpen(false);
  };

  const handleReceiveWithCredit = (
    saleId: string,
    payment: { cash: number; useCredit: number },
  ) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    const current = sale.amountReceived ?? 0;
    const pending = Math.max(0, sale.saleValue - current);
    const cash = Math.max(0, payment.cash || 0);
    const use = Math.max(0, payment.useCredit || 0);
    const applied = Math.min(cash + use, pending);
    const excess = Math.max(0, cash + use - pending);
    const next = Math.min(sale.saleValue, current + applied);
    receiveWithCreditM.mutate(
      { saleId, cash, useCredit: use },
      {
        onSuccess: () => {
          haptic.success();
          const viaCredito = use > 0 ? ` (usando R$ ${use.toFixed(2)} do saldo)` : "";
          const excedente =
            excess > 0 ? ` Excedente de R$ ${excess.toFixed(2)} registrado como crédito.` : "";
          toast.success(
            next >= sale.saleValue - 1e-9
              ? `Recebimento total registrado.${viaCredito}${excedente}`
              : `Recebido R$ ${applied.toFixed(2)}${viaCredito}. Pendente: R$ ${(sale.saleValue - next).toFixed(2)}.${excedente}`,
          );
        },
      },
    );
  };

  const handleRefundToCredit = (saleId: string, amount: number) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;
    refundToCreditM
      .mutateAsync({ saleId, amount })
      .then((res) => {
        haptic.success();
        toast.success(`R$ ${res.refunded.toFixed(2)} devolvido ao crédito de ${sale.clientName}.`);
      })
      .catch(() => {});
  };

  return {
    handleCreateSale,
    handleUpdateSale,
    handleReceiveWithCredit,
    handleRefundToCredit,
  };
}
