import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { ownerColor } from "@/lib/ownerColors";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Owner } from "@/types";

interface OwnerTableRowProps {
  owner: Owner;
  accountCount: number;
  onEdit: (owner: Owner) => void;
  onDelete: (id: string) => void;
}

export function OwnerTableRow({ owner, accountCount, onEdit, onDelete }: OwnerTableRowProps) {
  const deleteMessage =
    accountCount > 0
      ? `ATENÇÃO: Este dono possui ${accountCount} conta(s) vinculada(s) que também serão excluídas.`
      : "Esta ação não pode ser desfeita.";

  return (
    <TableRow>
      <TableCell className="hidden md:table-cell font-medium">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: ownerColor(owner.name, owner.color) }}
            aria-hidden
          />
          {owner.name}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono">{owner.cpf}</TableCell>
      <TableCell className="hidden md:table-cell">{owner.phone}</TableCell>
      <TableCell className="hidden md:table-cell">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {accountCount}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] min-w-[44px]"
            onClick={() => onEdit(owner)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteConfirmDialog
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Excluir dono?"
            description={`Tem certeza que deseja excluir o dono "${owner.name}"? ${deleteMessage}`}
            confirmLabel="Excluir dono"
            onConfirm={() => onDelete(owner.id)}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
