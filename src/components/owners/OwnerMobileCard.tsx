import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Owner } from "@/types";

interface OwnerMobileCardProps {
  owner: Owner;
  accountCount: number;
  onEdit: (owner: Owner) => void;
  onDelete: (id: string) => void;
}

export function OwnerMobileCard({ owner, accountCount, onEdit, onDelete }: OwnerMobileCardProps) {
  const deleteMessage =
    accountCount > 0
      ? `ATENÇÃO: Este dono possui ${accountCount} conta(s) vinculada(s) que também serão excluídas.`
      : "Esta ação não pode ser desfeita.";

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-base truncate">{owner.name}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary shrink-0 ml-2">
          {accountCount} conta(s)
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">CPF</span>
          <p className="font-mono truncate">{owner.cpf || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Telefone</span>
          <p className="truncate">{owner.phone || "—"}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1 border-t">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-2 min-h-[44px]"
          onClick={() => onEdit(owner)}
        >
          <Edit className="h-4 w-4" /> Editar
        </Button>
        <DeleteConfirmDialog
          trigger={
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          }
          title="Excluir dono?"
          description={`Tem certeza que deseja excluir o dono "${owner.name}"? ${deleteMessage}`}
          confirmLabel="Excluir dono"
          onConfirm={() => onDelete(owner.id)}
        />
      </div>
    </div>
  );
}
