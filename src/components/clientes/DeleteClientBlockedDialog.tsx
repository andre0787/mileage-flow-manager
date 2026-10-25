import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateBR } from "@/lib/dateUtils";

export interface RelatedSaleInfo {
  id: string;
  ticketLocator: string;
  date: string;
  milesUsed: number;
}

interface DeleteClientBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  relatedSales: RelatedSaleInfo[];
}

export function DeleteClientBlockedDialog({
  open,
  onOpenChange,
  clientName,
  relatedSales,
}: DeleteClientBlockedDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Exclusão não permitida
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <span>
                O cliente <strong>{clientName}</strong> possui vendas associadas e não pode ser
                excluído.
              </span>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Vendas vinculadas:</p>
                {relatedSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                  >
                    <span className="text-muted-foreground">{formatDateBR(sale.date)}</span>
                    <span className="font-mono text-xs">{sale.ticketLocator}</span>
                    <span className="font-medium">
                      {sale.milesUsed.toLocaleString("pt-BR")} milhas
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Remova as vendas vinculadas antes de excluir este cliente.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Entendi</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
