import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateBR } from "@/lib/dateUtils";
import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import type { PointEntry, Account } from "@/types";

export interface EntryMobileCardProps {
  entry: PointEntry;
  isPontos: boolean;
  account?: Account;
  ownerNameStr: string;
  donoCustomColorHex: string | null;
  origemName: string;
  onEdit: (entry: PointEntry) => void;
  onConfirm: (entry: PointEntry) => void;
}

export function EntryMobileCard({
  entry,
  isPontos,
  account,
  ownerNameStr,
  donoCustomColorHex,
  origemName,
  onEdit,
  onConfirm,
}: EntryMobileCardProps) {
  const donoColor = ownerColor(ownerNameStr, donoCustomColorHex);
  const donoSoft = ownerColorSoft(ownerNameStr, donoCustomColorHex);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="font-medium">{origemName}</p>
            {entry.cartAmount && entry.cartAmount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                🛒 Carrinho
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatDateBR(entry.date)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline">{account?.name}</Badge>
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: donoSoft, color: donoColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: donoColor }} />
            {ownerNameStr}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {entry.recurrenceInterval && entry.entryStatus !== "aguardando" && (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] gap-1"
          >
            🔄 Clube
          </Badge>
        )}
        {entry.entryStatus === "aguardando" && (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary text-[10px] gap-1"
          >
            ⏳ Aguardando
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">{isPontos ? "Pontos:" : "Milhas:"}</span>
          <p className="font-semibold">
            {isPontos
              ? entry.amount.toLocaleString("pt-BR")
              : (entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor Pago:</span>
          <p className="font-semibold">R$ {entry.amountPaid.toLocaleString("pt-BR")}</p>
        </div>
        {isPontos && (
          <div>
            <span className="text-muted-foreground">Milhas Geradas:</span>
            <p className="font-semibold text-success">
              {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Custo/Milha:</span>
          <p className="font-semibold">R$ {(entry.costPerMile ?? 0).toFixed(4)}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {entry.entryStatus === "aguardando" && (
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] gap-1 border-primary/40 dark:border-primary/60"
            onClick={() => onConfirm(entry)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Confirmar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="px-3 min-h-[44px]"
          onClick={() => onEdit(entry)}
        >
          Editar
        </Button>
        <DeleteEntryDialog entry={entry} />
      </div>
    </div>
  );
}
