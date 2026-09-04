import { useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface SaleMobileCardProps {
  sale: Sale;
  customColorHex?: string | null;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, amount: number) => void;
  onEdit?: (sale: Sale) => void;
  onCancelClick: (saleId: string) => void;
}

export function SaleMobileCard({
  sale,
  customColorHex = null,
  onStatusChange,
  onReceive,
  onEdit,
  onCancelClick,
}: SaleMobileCardProps) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const amountReceived = sale.amountReceived ?? 0;
  const pending = Math.max(0, sale.saleValue - amountReceived);
  return (
    <>
    <div
      className={`border rounded-lg p-4 space-y-3 ${sale.status === "cancelado" ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{sale.program}</p>
          <p className="text-xs text-muted-foreground truncate">
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
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
            </span>{" "}
            • {formatDateBR(sale.date)}
          </p>
        </div>
        {sale.status === "cancelado" ? (
          <Badge variant="outline" className="text-destructive border-destructive shrink-0 ml-2">
            Cancelado
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={`shrink-0 ml-2 ${sale.status === "pendente" ? "text-warning border-warning" : sale.status === "pago" ? "text-primary border-primary" : "text-success border-success"}`}
          >
            {sale.status === "pendente"
              ? "Pendente"
              : sale.status === "pago"
                ? "Pago"
                : "Concluído"}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Cliente:</span>
          <p className="font-semibold truncate">{sale.clientName}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Milhas:</span>
          <p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Valor:</span>
          <p className="font-semibold">
            {"R$ "}
            {sale.saleValue.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Lucro:</span>
          <p className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>
            {"R$ "}
            {sale.profit.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Pendente:</span>
          <p className="font-semibold">{pending > 0 ? `R$ ${pending.toLocaleString("pt-BR")}` : "—"}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {sale.ticketLocator && (
            <span className="truncate">Localizador: {sale.ticketLocator}</span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Users className="h-3 w-3" />
            {sale.passengers.length} pax
          </span>
        </div>
      </div>
      {sale.status !== "cancelado" && (
        <>
        <div className="flex items-center gap-2 pt-1 border-t">
          {onReceive && pending > 0 && (sale.status === "pendente" || sale.status === "pago") && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 min-h-[44px]"
              onClick={() => setReceiveOpen(true)}
            >
              Receber
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
              onValueChange={(v) =>
                onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")
              }
            >
              <SelectTrigger className="w-full min-h-[44px]">
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
          </div>
        </div>
        </>
      )}
    </div>
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
