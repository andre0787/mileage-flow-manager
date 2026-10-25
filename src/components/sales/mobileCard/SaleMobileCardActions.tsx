import { Button } from "@/components/ui/button";
import { CREDIT_EPSILON } from "@/lib/clientCredits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sale } from "@/types";

interface SaleMobileCardActionsProps {
  sale: Sale;
  pending: number;
  amountReceived: number;
  refundPending: boolean;
  onReceiveClick?: () => void;
  onRefundClick?: () => void;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
}

export function SaleMobileCardActions({
  sale,
  pending,
  amountReceived,
  refundPending,
  onReceiveClick,
  onRefundClick,
  onEdit,
  onCancelClick,
  onStatusChange,
}: SaleMobileCardActionsProps) {
  if (sale.status === "cancelado") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 pt-1 border-t">
      {onReceiveClick && pending > 0 && (sale.status === "pendente" || sale.status === "pago") && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 min-h-[44px]"
          onClick={onReceiveClick}
        >
          Receber
        </Button>
      )}
      {onRefundClick && amountReceived > CREDIT_EPSILON && (
        <Button
          variant="ghost"
          size="sm"
          className="text-warning hover:text-warning hover:bg-warning/10 h-9 px-3 min-h-[44px]"
          onClick={onRefundClick}
          disabled={refundPending || sale.status === "concluido"}
          title={sale.status === "concluido" ? "Reabra a venda para devolver" : undefined}
        >
          Devolver
        </Button>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 min-h-[44px]"
          onClick={() => onEdit(sale)}
        >
          Editar
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]"
        onClick={() => onCancelClick(sale.id)}
      >
        Cancelar
      </Button>
      <div className="flex-1">
        <Select
          value={sale.status}
          onValueChange={(v) => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}
        >
          <SelectTrigger className="w-full min-h-[44px]">
            <span
              className={`h-2 w-2 rounded-full ${
                sale.status === "pendente"
                  ? "bg-warning"
                  : sale.status === "pago"
                    ? "bg-primary"
                    : "bg-success"
              }`}
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
