import { Edit, Trash2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientCreditInfo } from "@/components/clientes/ClientCreditInfo";
import { Client } from "@/types";

interface ClientMobileCardProps {
  client: Client;
  onOpenAdvanceDrawer: (client: { id: string; name: string }) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string, name: string) => void;
}

export function ClientMobileCard({
  client,
  onOpenAdvanceDrawer,
  onEditClient,
  onDeleteClient,
}: ClientMobileCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {client.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{client.name}</p>
            <p className="text-xs text-muted-foreground">{client.email ?? "-"}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">CPF:</span>
          <p className="font-mono text-xs">{client.cpf ?? "-"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Saldo:</span>
          <ClientCreditInfo clientId={client.id} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline">{client.totalPurchases} compras</Badge>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            title="Registrar adiantamento (dinheiro recebido antes da emissão)"
            className="px-2 min-h-[44px] min-w-[44px]"
            onClick={() => onOpenAdvanceDrawer(client)}
          >
            <Banknote className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2 min-h-[44px] min-w-[44px]"
            onClick={() => onEditClient(client)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2 text-destructive hover:text-destructive min-h-[44px] min-w-[44px]"
            onClick={() => onDeleteClient(client.id, client.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
