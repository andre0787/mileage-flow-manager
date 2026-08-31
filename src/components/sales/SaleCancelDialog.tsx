import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SaleCancelDialogProps {
  cancelConfirmId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: (saleId: string) => void;
}

export function SaleCancelDialog({
  cancelConfirmId,
  onOpenChange,
  onConfirmCancel,
}: SaleCancelDialogProps) {
  return (
    <AlertDialog open={!!cancelConfirmId} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta. Esta
            ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => {
              if (cancelConfirmId) {
                onConfirmCancel(cancelConfirmId);
              }
            }}
          >
            Sim, cancelar venda
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
