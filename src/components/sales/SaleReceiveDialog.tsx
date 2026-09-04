import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";

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
  onConfirm: (payment: CreditPayment) => void;
}

export function SaleReceiveDialog({
  open,
  onOpenChange,
  saleValue,
  amountReceived,
  clientBalance = 0,
  clientName = "",
  onConfirm,
}: SaleReceiveDialogProps) {
  const pending = Math.max(0, saleValue - (amountReceived || 0));
  const balance = Math.max(0, clientBalance ?? 0);
  const maxUse = Math.min(balance, pending);

  const [cash, setCash] = useState<string>(pending ? pending.toFixed(2) : "");
  const [credit, setCredit] = useState<string>("0");

  // Reabrir (ou mudança no pendente/saldo) sempre exibe valores atuais,
  // nunca um valor digitado anteriormente.
  useEffect(() => {
    if (open) {
      setCash(pending ? pending.toFixed(2) : "");
      setCredit("0");
    }
  }, [open, pending]);

  const cashVal = Math.max(0, parseFloat(cash) || 0);
  const useCredit = Math.min(Math.max(0, parseFloat(credit) || 0), maxUse);
  const total = cashVal + useCredit;
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
        <div className="space-y-2">
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
          <div className="space-y-2">
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
          </div>
        )}
        {useCredit > 0 && (
          <p className="text-xs text-primary font-semibold">
            Usando R$ {useCredit.toFixed(2)} do saldo
            {cashVal > 0 ? ` + R$ ${cashVal.toFixed(2)} em dinheiro` : ""}.
          </p>
        )}
        {excess > 0 && (
          <p className="text-xs text-warning font-semibold">
            Excedente de R$ {excess.toFixed(2)} será registrado como crédito
            {clientName ? ` de ${clientName}` : ""}.
          </p>
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
