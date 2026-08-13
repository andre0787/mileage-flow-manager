import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

interface AccountsSummaryProps {
  accounts: Account[];
  /** Saldo calculado por conta (entradas - transferências - vendas) */
  computedBalances: Map<string, number>;
}

export function AccountsSummary({ accounts, computedBalances }: AccountsSummaryProps) {
  const totalByType = (type: "pontos" | "milhas") =>
    accounts
      .filter((a) => a.type === type)
      .reduce((s, a) => s + (computedBalances.get(a.id) ?? a.balance), 0)
      .toLocaleString("pt-BR");

  const stats = [
    {
      label: "Total de Contas",
      value: String(accounts.length),
      className: "bg-muted/30",
      valueClass: "text-foreground",
    },
    {
      label: "Contas Ativas",
      value: String(accounts.filter((a) => a.status === "ativa").length),
      className: "bg-success-light",
      valueClass: "text-success",
    },
    {
      label: "Total Pontos",
      value: totalByType("pontos"),
      className: "bg-muted/30",
      valueClass: "text-foreground",
    },
    {
      label: "Total Milhas",
      value: totalByType("milhas"),
      className: "bg-success-light",
      valueClass: "text-success",
    },
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Resumo das Contas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {stats.map((s) => (
            <div key={s.label} className={cn("text-center p-4 rounded-lg", s.className)}>
              <p className={cn("text-2xl font-bold", s.valueClass)}>{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
