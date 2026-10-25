import { useState } from "react";
import { SaleReceiveDialog, type CreditPayment } from "@/components/sales/SaleReceiveDialog";
import { SaleRefundDialog } from "@/components/sales/SaleRefundDialog";
import { useClientBalanceQuery } from "@/features/clientes/hooks";
import { SaleMobileCardHeader } from "./mobileCard/SaleMobileCardHeader";
import { SaleMobileCardDetails } from "./mobileCard/SaleMobileCardDetails";
import { SaleMobileCardMeta } from "./mobileCard/SaleMobileCardMeta";
import { SaleMobileCardActions } from "./mobileCard/SaleMobileCardActions";
import type { Sale } from "@/types";

interface SaleMobileCardProps {
  sale: Sale;
  customColorHex?: string | null;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, payment: CreditPayment) => void;
  onRefund?: (saleId: string, amount: number) => void;
  refundPending?: boolean;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
}

export function SaleMobileCard({
  sale,
  customColorHex = null,
  onStatusChange,
  onReceive,
  onRefund,
  refundPending = false,
  onEdit,
  onCancelClick,
}: SaleMobileCardProps) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const amountReceived = sale.amountReceived ?? 0;
  const pending = Math.max(0, sale.saleValue - amountReceived);
  const { balance: creditBalance, movements: creditMoves } = useClientBalanceQuery(sale.clientId);
  const hasCredit = creditMoves.some((m) => m.saleId === sale.id);

  return (
    <>
      <div
        className={`border rounded-lg p-4 space-y-3 ${
          sale.status === "cancelado" ? "opacity-50" : ""
        }`}
      >
        <SaleMobileCardHeader sale={sale} customColorHex={customColorHex} />
        <SaleMobileCardDetails sale={sale} amountReceived={amountReceived} pending={pending} />
        <SaleMobileCardMeta sale={sale} hasCredit={hasCredit} creditBalance={creditBalance} />
        <SaleMobileCardActions
          sale={sale}
          pending={pending}
          amountReceived={amountReceived}
          refundPending={refundPending}
          onReceiveClick={onReceive ? () => setReceiveOpen(true) : undefined}
          onRefundClick={onRefund ? () => setRefundOpen(true) : undefined}
          onEdit={onEdit}
          onCancelClick={onCancelClick}
          onStatusChange={onStatusChange}
        />
      </div>

      {onReceive && (
        <SaleReceiveDialog
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          saleValue={sale.saleValue}
          amountReceived={amountReceived}
          clientBalance={creditBalance}
          clientName={sale.clientName}
          saleMovements={creditMoves.filter((m) => m.saleId === sale.id)}
          onConfirm={(payment) => onReceive(sale.id, payment)}
        />
      )}

      {onRefund && (
        <SaleRefundDialog
          open={refundOpen}
          onOpenChange={setRefundOpen}
          saleValue={sale.saleValue}
          amountReceived={amountReceived}
          clientName={sale.clientName}
          saleMovements={creditMoves.filter((m) => m.saleId === sale.id)}
          isPending={refundPending}
          onConfirm={(amount) => onRefund(sale.id, amount)}
        />
      )}
    </>
  );
}
