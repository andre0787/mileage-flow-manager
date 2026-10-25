import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CREDIT_EPSILON } from "@/lib/clientCredits";
import type { Sale } from "@/types";

interface SaleActionsCellProps {
  sale: Sale;
  isOnline: boolean;
  hasCredit: boolean;
  creditBalance: number;
  pending: number;
  amountReceived: number;
  refundPending: boolean;
  canReceive: boolean;
  canRefund: boolean;
  onReceiveClick: () => void;
  onRefundClick: () => void;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
}

export function SaleActionsCell({
  sale,
  isOnline,
  hasCredit,
  creditBalance,
  pending,
  amountReceived,
  refundPending,
  canReceive,
  canRefund,
  onReceiveClick,
  onRefundClick,
  onEdit,
  onCancelClick,
}: SaleActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs">{sale.passengers.length} pax</span>
      {sale.kind === "servico" && (
        <span
          className="rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400"
          title="Venda de serviço (sem milhas)"
        >
          Serviço
        </span>
      )}
      {hasCredit && (
        <span
          className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
          title="Venda com movimento de crédito"
        >
          Crédito
        </span>
      )}
      {creditBalance > 0 && (
        <span
          className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success"
          title={`Cliente com saldo de crédito disponível: R$ ${creditBalance.toLocaleString("pt-BR")}`}
        >
          Crédito R$ {creditBalance.toLocaleString("pt-BR")}
        </span>
      )}
      {sale.status !== "cancelado" && (
        <>
          {canReceive && pending > 0 && (sale.status === "pendente" || sale.status === "pago") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-primary hover:text-primary"
              onClick={onReceiveClick}
              disabled={!isOnline}
              title={!isOnline ? "Requer conexão" : "Registrar recebimento"}
            >
              Receber
            </Button>
          )}
          {canRefund && amountReceived > CREDIT_EPSILON && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-warning hover:text-warning"
              onClick={onRefundClick}
              disabled={!isOnline || refundPending || sale.status === "concluido"}
              title={
                !isOnline
                  ? "Requer conexão"
                  : sale.status === "concluido"
                    ? "Reabra a venda para devolver"
                    : "Devolver ao crédito do cliente"
              }
            >
              Devolver
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onEdit(sale)}
            >
              Editar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-6 text-xs"
            onClick={() => onCancelClick(sale.id)}
            disabled={!isOnline}
            title={!isOnline ? "Requer conexão" : undefined}
          >
            Cancelar
          </Button>
        </>
      )}
    </div>
  );
}
