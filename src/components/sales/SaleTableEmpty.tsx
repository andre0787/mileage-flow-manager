import { Package, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

interface SaleTableEmptyProps {
  onCreateClick?: () => void;
}

export function SaleTableEmpty({ onCreateClick }: SaleTableEmptyProps) {
  return (
    <Card className="shadow-card animate-appear animate-delay-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Histórico de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-8">
          <EmptyState
            icon={Package}
            title="Nenhuma venda encontrada"
            description="Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer."
            action={onCreateClick ? { label: "Nova Venda", onClick: onCreateClick } : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}
