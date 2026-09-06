import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import type { ClientCredit } from "@/types";

interface SaleRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleValue: number;
  amountReceived: number;
  clientName?: string;
  /**
   * Movimentações de crédito desta venda (para o extrato).
   * Quem chama filtra por saleId — sem modelo novo.
   */
  saleMovements?: ClientCredit[];
  /** Desabilita Confirmar enquanto um refund está em voo (anti-duplo-clique). */
  isPending?: boolean;
  onConfirm: (amount: number) => void;
}

export function SaleRefundDialog({
  open,
  onOpenChange,
  saleValue,
  amountReceived,
  clientName = "",
  saleMovements = [],
  isPending = false,
  onConfirm,
}: SaleRefundDialogProps) {
  const received = Math.max(0, amountReceived || 0);
  const [value, setValue] = useState<string>(received ? received.toFixed(2) : "");

  // Reabrir sempre exibe o valor atual, nunca um valor digitado anteriormente.
  useEffect(() => {
    if (open) setValue(received ? received.toFixed(2) : "");
  }, [open, received]);

  const amount = Math.min(Math.max(0, parseFloat(value) || 0), received);
  const newReceived = Math.max(0, received - amount);
  const backToPending = amount > 0 && newReceived < saleValue;
  const valid = amount > 0;

  const saleStatement = (saleMovements ?? []).filter((m) => m && typeof m.amount === "number");

  return (
    <FormDrawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
      }}
      title="Devolver ao crédito"
    >
      <div className="grid gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Valor da venda: <span className="font-semibold">R$ {saleValue.toFixed(2)}</span>
          </p>
          <p>
            Já recebido: <span className="font-semibold">R$ {received.toFixed(2)}</span>
          </p>
          {clientName && (
            <p>
              Crédito volta para: <span className="font-semibold">{clientName}</span>
            </p>
          )}
        </div>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Label>Valor a devolver (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max={received}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 100.00"
            aria-label="Valor a devolver ao crédito"
          />
          <p className="text-xs text-muted-foreground">
            Máximo: R$ {received.toFixed(2)} (total recebido).
          </p>
          {!valid && value.trim() !== "" && (
            <p className="text-xs text-destructive">Informe um valor maior que zero.</p>
          )}
        </div>
        {valid && (
          <p className="text-xs text-primary font-semibold">
            R$ {amount.toFixed(2)} volta ao crédito
            {clientName ? ` de ${clientName}` : ""} • Recebido restante: R${" "}
            {newReceived.toFixed(2)}
            {backToPending ? " • venda volta a pendente" : ""}.
          </p>
        )}
        {saleStatement.length > 0 && (
          <div className="space-y-1" aria-label="Extrato da venda">
            <Label>Recibos desta venda</Label>
            {saleStatement.map((m) => {
              const sign =
                m.kind === "earn"
                  ? "+"
                  : m.kind === "spend"
                    ? "−"
                    : m.reversalOf === "spend"
                      ? "+"
                      : "−";
              const label =
                m.kind === "earn"
                  ? "Crédito gerado"
                  : m.kind === "spend"
                    ? "Crédito usado"
                    : m.reversalOf === "spend"
                      ? "Estorno (devolução)"
                      : "Estorno (remoção)";
              return (
                <p key={m.id} className="text-xs text-muted-foreground">
                  {label}: {sign + "R$ "}
                  {Number(m.amount).toFixed(2)}
                </p>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          className="bg-gradient-primary hover:opacity-90"
          disabled={!valid || isPending}
          onClick={() => {
            onConfirm(amount);
            onOpenChange(false);
          }}
        >
          {isPending ? "Devolvendo..." : "Confirmar devolução"}
        </Button>
      </div>
    </FormDrawer>
  );
}
