import type { Sale } from "@/types";

interface SaleMobileCardDetailsProps {
  sale: Sale;
  amountReceived: number;
  pending: number;
}

export function SaleMobileCardDetails({
  sale,
  amountReceived,
  pending,
}: SaleMobileCardDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-muted-foreground text-xs">Cliente:</span>
        <p className="font-semibold truncate">{sale.clientName}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Milhas:</span>
        <p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Valor:</span>
        <p className="font-semibold">
          {"R$ "}
          {sale.saleValue.toLocaleString("pt-BR")}
        </p>
        {amountReceived > 0 && (
          <p className="text-xs text-muted-foreground">
            Quitado R$ {amountReceived.toLocaleString("pt-BR")} de R${" "}
            {sale.saleValue.toLocaleString("pt-BR")}
          </p>
        )}
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Lucro:</span>
        <p className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>
          {"R$ "}
          {sale.profit.toLocaleString("pt-BR")}
        </p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">Pendente:</span>
        <p className="font-semibold">
          {pending > 0 ? `R$ ${pending.toLocaleString("pt-BR")}` : "—"}
        </p>
      </div>
    </div>
  );
}
