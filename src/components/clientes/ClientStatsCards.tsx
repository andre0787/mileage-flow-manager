import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/types";

interface ClientStatsCardsProps {
  clients: Client[];
}

export function ClientStatsCards({ clients }: ClientStatsCardsProps) {
  const activeClientsCount = clients.filter((c) => c.totalPurchases > 0).length;
  const totalPurchasesCount = clients.reduce((sum, client) => sum + client.totalPurchases, 0);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300">
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{clients.length}</div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clientes Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{activeClientsCount}</div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalPurchasesCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
