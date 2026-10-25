import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sale } from "@/types";

interface SaleStatusCellProps {
  saleId: string;
  status: Sale["status"];
  isOnline: boolean;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
}

export function SaleStatusCell({ saleId, status, isOnline, onStatusChange }: SaleStatusCellProps) {
  if (status === "cancelado") {
    return <StatusBadge status="cancelado" size="sm" />;
  }
  return (
    <Select
      value={status}
      onValueChange={(v) => onStatusChange?.(saleId, v as "pendente" | "pago" | "concluido")}
      disabled={!isOnline}
    >
      <SelectTrigger className="w-28" title={!isOnline ? "Requer conexão" : undefined}>
        <span
          className={`h-2 w-2 rounded-full ${status === "pendente" ? "bg-warning" : status === "pago" ? "bg-primary" : "bg-success"}`}
        />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pendente">Pendente</SelectItem>
        <SelectItem value="pago">Pago</SelectItem>
        <SelectItem value="concluido">Concluído</SelectItem>
      </SelectContent>
    </Select>
  );
}
