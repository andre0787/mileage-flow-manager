import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Program, Account } from "@/types";

interface ProgramMobileListProps {
  programs: Program[];
  accounts: Account[];
  onEdit: (program: Program) => void;
  onDelete: (id: string) => void;
}

export function ProgramMobileList({
  programs,
  accounts,
  onEdit,
  onDelete,
}: ProgramMobileListProps) {
  const isProgramInUse = (id: string) => accounts.some((a) => a.programId === id);

  return (
    <div className="md:hidden space-y-3 mt-4">
      {programs.map((program) => {
        const disabled = isProgramInUse(program.id);
        return (
          <div key={program.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-base truncate">{program.name}</p>
              <Badge
                variant={program.type === "pontos" ? "secondary" : "default"}
                className="shrink-0 ml-2"
              >
                {program.type === "pontos" ? "Pontos" : "Milhas"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Controle</span>
                <p className="truncate">
                  {program.passengerCycleType
                    ? program.passengerCycleType === "anual"
                      ? `Anual — ${program.maxPassengers ?? "?"} pax/ano`
                      : `${program.maxPassengers ?? "?"} pax/${program.passengerCycleDays ?? "?"}d`
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1 border-t">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2 min-h-[44px]"
                onClick={() => onEdit(program)}
              >
                <Edit className="h-4 w-4" /> Editar
              </Button>
              <DeleteConfirmDialog
                trigger={
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive"
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                }
                title="Excluir programa?"
                description={
                  disabled
                    ? `Não é possível excluir o programa "${program.name}" pois existem contas vinculadas. Remova as contas primeiro.`
                    : `Tem certeza que deseja excluir o programa "${program.name}"? Esta ação não pode ser desfeita.`
                }
                confirmLabel="Excluir programa"
                onConfirm={() => onDelete(program.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
