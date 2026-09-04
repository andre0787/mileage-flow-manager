import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SaleReceiveDialog } from "@/components/sales/SaleReceiveDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateBR } from "@/lib/dateUtils";
import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";
import type { Sale } from "@/types";

interface SaleTableRowProps {
  sale: Sale;
  customColorHex?: string | null;
  isOnline: boolean;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, amount: number) => void;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
}

export function SaleTableRow({
  sale,
  customColorHex = null,
  isOnline,
  onStatusChange,
  onReceive,
  onEdit,
  onCancelClick,
}: SaleTableRowProps) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const amountReceived = sale.amountReceived ?? 0;
  const pending = Math.max(0, sale.saleValue - amountReceived);
  return (
    <>
    <TableRow className={sale.status === "cancelado" ? "opacity-50" : ""}>
      <TableCell>{formatDateBR(sale.date)}</TableCell>
      <TableCell>
        <p className="font-medium">{sale.ownerName}</p>
        <p className="text-xs text-muted-foreground">{sale.program}</p>
        <span
          className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            backgroundColor: ownerColorSoft(sale.ownerName, customColorHex),
            color: ownerColor(sale.ownerName, customColorHex),
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: ownerColor(sale.ownerName, customColorHex),
            }}
          />
          {sale.ownerName}
        </span>
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
        {sale.status === "cancelado" ? (
          <StatusBadge status="cancelado" size="sm" />
        ) : (
          <Select
            value={sale.status}
            onValueChange={(v) => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}
            disabled={!isOnline}
          >
            <SelectTrigger className="w-28" title={!isOnline ? "Requer conexão" : undefined}>
              <span
                className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs">{sale.passengers.length} pax</span>
          {sale.status !== "cancelado" && (
            <>
              {onReceive && pending > 0 && (sale.status === "pendente" || sale.status === "pago") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-primary hover:text-primary"
                  onClick={() => setReceiveOpen(true)}
                  disabled={!isOnline}
                  title={!isOnline ? "Requer conexão" : "Registrar recebimento"}
                >
                  Receber
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
      </TableCell>
    </TableRow>
    {onReceive && (
      <SaleReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        saleValue={sale.saleValue}
        amountReceived={amountReceived}
        onConfirm={(amount) => onReceive(sale.id, amount)}
      />
    )}
    </>
  );
}
