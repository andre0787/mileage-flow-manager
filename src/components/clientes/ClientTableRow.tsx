import { Phone, Edit, Trash2, Banknote } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientCreditInfo } from "@/components/clientes/ClientCreditInfo";
import { Client } from "@/types";

interface ClientTableRowProps {
  client: Client;
  onOpenAdvanceDrawer: (client: { id: string; name: string }) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string, name: string) => void;
}

export function ClientTableRow({
  client,
  onOpenAdvanceDrawer,
  onEditClient,
  onDeleteClient,
}: ClientTableRowProps) {
  return (
    <TableRow className="transition-colors">
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {client.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.email ?? "-"}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono">{client.cpf ?? "-"}</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{client.phone}</span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline">{client.totalPurchases} compras</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-right">
        <ClientCreditInfo clientId={client.id} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {client.usageHistory.map((usage, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {usage.program}: {usage.count}x
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            title="Registrar adiantamento (dinheiro recebido antes da emissão)"
            className="px-2 min-w-[44px] min-h-[44px]"
            onClick={() => onOpenAdvanceDrawer(client)}
          >
            <Banknote className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2 min-w-[44px] min-h-[44px]"
            onClick={() => onEditClient(client)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2 text-destructive hover:text-destructive min-w-[44px] min-h-[44px]"
            onClick={() => onDeleteClient(client.id, client.name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
