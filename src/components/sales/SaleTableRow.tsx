import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { SaleReceiveDialog, type CreditPayment } from "@/components/sales/SaleReceiveDialog";
import { SaleRefundDialog } from "@/components/sales/SaleRefundDialog";
import { serviceTypeLabel } from "@/lib/saleKind";
import { useClientBalanceQuery } from "@/features/clientes/hooks";
import { formatDateBR } from "@/lib/dateUtils";
import { OwnerBadge } from "@/components/sales/OwnerBadge";
import { SaleStatusCell } from "@/components/sales/SaleStatusCell";
import { SaleActionsCell } from "@/components/sales/SaleActionsCell";
import type { Sale } from "@/types";

interface SaleTableRowProps {
  sale: Sale;
  customColorHex?: string | null;
  isOnline: boolean;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, payment: CreditPayment) => void;
  onRefund?: (saleId: string, amount: number) => void;
  refundPending?: boolean;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
}

export function SaleTableRow({
  sale,
  customColorHex = null,
  isOnline,
  onStatusChange,
  onReceive,
  onRefund,
  refundPending = false,
  onEdit,
  onCancelClick,
}: SaleTableRowProps) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const amountReceived = sale.amountReceived ?? 0;
  const pending = Math.max(0, sale.saleValue - amountReceived);
  const { balance: creditBalance, movements: creditMoves } = useClientBalanceQuery(sale.clientId);
  const hasCredit = creditMoves.some((m) => m.saleId === sale.id);

  return (
    <>
      <TableRow className={sale.status === "cancelado" ? "opacity-50" : ""}>
        <TableCell>{formatDateBR(sale.date)}</TableCell>
        <TableCell>
          <p className="font-medium">
            {sale.kind === "servico" ? serviceTypeLabel(sale.serviceType) : sale.ownerName}
          </p>
          <OwnerBadge ownerName={sale.ownerName} customColorHex={customColorHex} />
        </TableCell>
        <TableCell>
          <p className="font-medium">{sale.kind === "servico" ? "Serviço" : sale.program || "—"}</p>
        </TableCell>
        <TableCell>
          <p className="font-medium">{sale.clientName}</p>
          <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {sale.milesUsed.toLocaleString("pt-BR")}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {"R$ "}
          {sale.saleValue.toLocaleString("pt-BR")}
          {amountReceived > 0 && (
            <p className="text-xs text-muted-foreground">
              Quitado R$ {amountReceived.toLocaleString("pt-BR")} de R${" "}
              {sale.saleValue.toLocaleString("pt-BR")}
            </p>
          )}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {pending > 0 ? `R$ ${pending.toLocaleString("pt-BR")}` : "—"}
        </TableCell>
        <TableCell
          className={`text-right tabular-nums font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}
        >
          {"R$ "}
          {sale.profit.toLocaleString("pt-BR")}
        </TableCell>
        <TableCell className="text-right tabular-nums">{sale.profitMargin.toFixed(1)}%</TableCell>
        <TableCell>
          <SaleStatusCell
            saleId={sale.id}
            status={sale.status}
            isOnline={isOnline}
            onStatusChange={onStatusChange}
          />
        </TableCell>
        <TableCell>
          <SaleActionsCell
            sale={sale}
            isOnline={isOnline}
            hasCredit={hasCredit}
            creditBalance={creditBalance}
            pending={pending}
            amountReceived={amountReceived}
            refundPending={refundPending}
            canReceive={Boolean(onReceive)}
            canRefund={Boolean(onRefund)}
            onReceiveClick={() => setReceiveOpen(true)}
            onRefundClick={() => setRefundOpen(true)}
            onEdit={onEdit}
            onCancelClick={onCancelClick}
          />
        </TableCell>
      </TableRow>
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
