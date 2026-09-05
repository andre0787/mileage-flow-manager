import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import type { ClientCredit } from "@/types";

/** Pagamento com crédito: dinheiro + abatimento do saldo do cliente. */
export interface CreditPayment {
  cash: number;
  useCredit: number;
}

interface SaleReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleValue: number;
  amountReceived: number;
  /**
   * Saldo de crédito do cliente (fonte: Worker A — getClientBalance).
   * Default 0 = comportamento legado (só dinheiro, sem excedente visível).
   */
  clientBalance?: number;
  clientName?: string;
  /**
   * Movimentações de crédito desta venda (para o extrato).
   * Quem chama filtra por saleId — sem modelo novo.
   */
  saleMovements?: ClientCredit[];
  onConfirm: (payment: CreditPayment) => void;
}

export function SaleReceiveDialog({
  open,
  onOpenChange,
  saleValue,
  amountReceived,
  clientBalance = 0,
  clientName = "",
  saleMovements = [],
  onConfirm,
}: SaleReceiveDialogProps) {
  const pending = Math.max(0, saleValue - (amountReceived || 0));
  const balance = Math.max(0, clientBalance ?? 0);
  const maxUse = Math.min(balance, pending);

  const [cash, setCash] = useState<string>(pending ? pending.toFixed(2) : "");
  const [credit, setCredit] = useState<string>("0");
  const [payWithCredit, setPayWithCredit] = useState(false);

  // Reabrir (ou mudança no pendente/saldo) sempre exibe valores atuais,
  // nunca um valor digitado anteriormente.
  useEffect(() => {
    if (open) {
      setCash(pending ? pending.toFixed(2) : "");
      setCredit("0");
      setPayWithCredit(false);
    }
  }, [open, pending]);

  // Extrato da venda: só movimentos de crédito desta venda (ledger por saleId).

  const saleStatement = (saleMovements ?? []).filter(
    (m) => m && typeof m.amount === "number",
  );
  const cashVal = Math.max(0, parseFloat(cash) || 0);
  const useCredit = payWithCredit
    ? Math.min(Math.max(0, parseFloat(credit) || 0), maxUse)
    : 0;
  const total = cashVal + useCredit;
  const remaining = Math.max(0, pending - total);
  // Excedente acima do pendente vira crédito automático (Worker A persiste o earn).
  const excess = Math.max(0, total - pending);
  const valid = total > 0;

  return (
    <FormDrawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
      }}
      title="Registrar recebimento"
    >
      <div className="grid gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Valor da venda: <span className="font-semibold">R$ {saleValue.toFixed(2)}</span>
          </p>
          <p>
            Já recebido:{" "}
            <span className="font-semibold">R$ {(amountReceived || 0).toFixed(2)}</span>
          </p>
          <p>
            Saldo pendente: <span className="font-semibold">R$ {pending.toFixed(2)}</span>
          </p>
          {balance > 0 && (
            <p>
              Crédito de {clientName || "cliente"}:{" "}
              <span className="font-semibold text-primary">R$ {balance.toFixed(2)}</span>
            </p>
          )}
        </div>
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground">Caixa 1 · Dinheiro novo</p>
          <Label>Valor recebido agora (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
            placeholder="Ex: 100.00"
          />
          {!valid && cash.trim() !== "" && (
            <p className="text-xs text-destructive">Informe um valor maior que zero.</p>
          )}
        </div>
        {balance > 0 && (
          <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-muted-foreground">Caixa 2 · Crédito atual</p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sale-receive-use-credit"
                checked={payWithCredit}
                onChange={(e) => setPayWithCredit(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <Label htmlFor="sale-receive-use-credit">Pagar com crédito</Label>
            </div>
            {payWithCredit && (
              <>
                <Label>Usar saldo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxUse}
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="0.00"
                  aria-label="Usar saldo de crédito"
                />
                <p className="text-xs text-muted-foreground">
                  Disponível: R$ {maxUse.toFixed(2)} para esta venda.
                </p>
              </>
            )}
          </div>
        )}
        {useCredit > 0 && (
          <p className="text-xs text-primary font-semibold">
            Usando R$ {useCredit.toFixed(2)} do saldo
            {cashVal > 0 ? ` + R$ ${cashVal.toFixed(2)} em dinheiro` : ""}.
          </p>
        )}
        {total > 0 && (
          <p className="text-xs font-semibold text-muted-foreground">
            Total aplicado: R$ {total.toFixed(2)} (R$ {cashVal.toFixed(2)} em dinheiro + R${" "}
            {useCredit.toFixed(2)} de crédito) • Pendente restante: R${" "}
            {remaining.toFixed(2)}
          </p>
        )}
        {excess > 0 && (
          <p className="text-xs text-warning font-semibold">
            Excedente de R$ {excess.toFixed(2)} será registrado como crédito
            {clientName ? ` de ${clientName}` : ""}.
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
          disabled={!valid}
          onClick={() => {
            onConfirm({ cash: cashVal, useCredit });
            onOpenChange(false);
          }}
        >
          Confirmar recebimento
        </Button>
      </div>
    </FormDrawer>
  );
}
