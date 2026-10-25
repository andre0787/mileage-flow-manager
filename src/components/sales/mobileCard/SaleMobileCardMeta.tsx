import { Users } from "lucide-react";
import type { Sale } from "@/types";

interface SaleMobileCardMetaProps {
  sale: Sale;
  hasCredit: boolean;
  creditBalance: number;
}

export function SaleMobileCardMeta({ sale, hasCredit, creditBalance }: SaleMobileCardMetaProps) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {sale.ticketLocator && <span className="truncate">Localizador: {sale.ticketLocator}</span>}
        {sale.kind !== "servico" && (
          <span className="flex items-center gap-1 shrink-0">
            <Users className="h-3 w-3" />
            {sale.passengers.length} pax
          </span>
        )}
        {sale.kind === "servico" && sale.observations && (
          <span className="truncate" title={sale.observations}>
            Obs: {sale.observations}
          </span>
        )}
        {sale.kind === "servico" && (
          <span
            className="rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400 shrink-0"
            title="Venda de serviço (sem milhas)"
          >
            Serviço
          </span>
        )}
        {hasCredit && (
          <span
            className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary shrink-0"
            title="Venda com movimento de crédito"
          >
            Crédito
          </span>
        )}
        {creditBalance > 0 && (
          <span
            className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success shrink-0"
            title={`Cliente com saldo de crédito disponível: R$ ${creditBalance.toLocaleString("pt-BR")}`}
          >
            Crédito R$ {creditBalance.toLocaleString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
}
