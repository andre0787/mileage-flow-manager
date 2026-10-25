import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientHeaderProps {
  onOpenCreate: () => void;
}

export function ClientHeader({ onOpenCreate }: ClientHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus clientes e acompanhe o histórico de utilização
        </p>
      </div>

      <Button
        className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
        onClick={onOpenCreate}
      >
        <Plus className="h-4 w-4" />
        Novo Cliente
      </Button>
    </div>
  );
}
