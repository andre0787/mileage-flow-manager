import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteSaleMutation, useDeleteEntryMutation } from "@/hooks/useDatabase";
import { useData } from "@/contexts/DataContext";
import type { PointEntry } from "@/types";

interface Props {
  entry: PointEntry;
}

export function DeleteEntryDialog({ entry }: Props) {
  const { sales } = useData();
  const deleteEntryM = useDeleteEntryMutation();
  const deleteSaleM = useDeleteSaleMutation();

  const relatedSales = sales?.filter((s) => s.accountId === entry.accountId) || [];
  const hasSales = relatedSales.length > 0;

  const handleDelete = async () => {
    // Delete related sales first
    for (const sale of relatedSales) {
      await deleteSaleM.mutateAsync(sale.id);
    }
    // Then delete the entry
    await deleteEntryM.mutateAsync(entry);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="px-3 text-destructive min-h-[44px]">
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasSales
              ? `Esta entrada possui ${relatedSales.length} venda(s) vinculada(s) na mesma conta. A exclusão removerá a entrada E todas as ${relatedSales.length} venda(s) relacionadas. O saldo da conta será restaurado.`
              : "Esta ação não pode ser desfeita. A entrada será removida permanentemente e o saldo da conta será ajustado."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground"
            onClick={async (e) => {
              e.preventDefault();
              await handleDelete();
            }}
          >
            {hasSales ? `Excluir entrada e ${relatedSales.length} venda(s)` : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
