import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";

interface SaleReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleValue: number;
  amountReceived: number;
  onConfirm: (amount: number) => void;
}

export function SaleReceiveDialog({
  open,
  onOpenChange,
  saleValue,
  amountReceived,
  onConfirm,
}: SaleReceiveDialogProps) {
  const pending = Math.max(0, saleValue - (amountReceived || 0));
  const [value, setValue] = useState<string>(pending ? pending.toFixed(2) : "");
  const parsed = parseFloat(value) || 0;
  const valid = parsed > 0 && parsed <= pending + 1e-9;

  return (
    <FormDrawer
      open={open}
      onOpenChange={(o) => {
        if (!o) setValue(pending ? pending.toFixed(2) : "");
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
        </div>
        <div className="space-y-2">
          <Label>Valor recebido agora (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max={pending}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 100.00"
          />
          {!valid && value.trim() !== "" && (
            <p className="text-xs text-destructive">
              Informe um valor maior que zero e até R$ {pending.toFixed(2)}.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          className="bg-gradient-primary hover:opacity-90"
          disabled={!valid}
          onClick={() => {
            onConfirm(parsed);
            onOpenChange(false);
          }}
        >
          Confirmar recebimento
        </Button>
      </div>
    </FormDrawer>
  );
}
