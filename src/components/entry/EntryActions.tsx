import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import type { PointEntry } from "@/types";

export interface EntryActionsProps {
  entry: PointEntry;
  isOnline: boolean;
  onConfirm: (entry: PointEntry) => void;
  onEdit: (entry: PointEntry) => void;
}

export function EntryActions({ entry, isOnline, onConfirm, onEdit }: EntryActionsProps) {
  return (
    <div className="flex gap-2 justify-end">
      {entry.entryStatus === "aguardando" && (
        <Button
          size="sm"
          variant="outline"
          className="px-3 min-h-[44px] gap-1 border-primary/40 dark:border-primary/60"
          onClick={() => onConfirm(entry)}
          disabled={!isOnline}
          title={!isOnline ? "Requer conexão" : undefined}
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
        disabled={!isOnline}
        title={!isOnline ? "Requer conexão" : undefined}
      >
        Editar
      </Button>
      <DeleteEntryDialog entry={entry} />
    </div>
  );
}
