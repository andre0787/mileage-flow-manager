import { Edit, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountActionsProps {
  isActive: boolean;
  recalcPending: boolean;
  onToggleStatus: () => void;
  onEdit: () => void;
  onRecalc: () => void;
  onDelete: () => void;
}

export function AccountActions({
  isActive,
  recalcPending,
  onToggleStatus,
  onEdit,
  onRecalc,
  onDelete,
}: AccountActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <Button
        size="sm"
        variant="outline"
        onClick={onToggleStatus}
        className="flex-1 min-h-[44px]"
      >
        {isActive ? "Desativar" : "Ativar"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-3 min-h-[44px] min-w-[44px]"
        onClick={onEdit}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-3 min-h-[44px] min-w-[44px]"
        onClick={onRecalc}
        disabled={recalcPending}
        title="Recalcular saldo (entradas - vendas)"
      >
        <RefreshCw className={cn("h-4 w-4", recalcPending && "animate-spin")} />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
