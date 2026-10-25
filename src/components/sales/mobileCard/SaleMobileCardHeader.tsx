import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "@/lib/dateUtils";
import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";
import { serviceTypeLabel } from "@/lib/saleKind";
import type { Sale } from "@/types";

interface SaleMobileCardHeaderProps {
  sale: Sale;
  customColorHex?: string | null;
}

export function SaleMobileCardHeader({ sale, customColorHex = null }: SaleMobileCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">
          {sale.kind === "servico" ? serviceTypeLabel(sale.serviceType) : sale.program}
        </p>
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
          className={`shrink-0 ml-2 ${
            sale.status === "pendente"
              ? "text-warning border-warning"
              : sale.status === "pago"
                ? "text-primary border-primary"
                : "text-success border-success"
          }`}
        >
          {sale.status === "pendente"
            ? "Pendente"
            : sale.status === "pago"
              ? "Pago"
              : "Concluído"}
        </Badge>
      )}
    </div>
  );
}
