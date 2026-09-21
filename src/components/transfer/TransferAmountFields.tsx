import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Account } from "@/types";

interface TransferAmountFieldsProps {
  sourceAccount: Account | undefined;
  form: { amount: string; amountPaid: string; bonusPercent: string };
  errors: Record<string, string>;
  set: (patch: Record<string, string>) => void;
  clearErr: (field: string) => void;
  avgCostPerPoint: number;
  amountNum: number;
  bonusNum: number;
  calculatedCost: number;
  effectiveMiles: number;
}

export function TransferAmountFields({
  sourceAccount,
  form,
  errors,
  set,
  clearErr,
  avgCostPerPoint,
  amountNum,
  bonusNum,
  calculatedCost,
  effectiveMiles,
}: TransferAmountFieldsProps) {
  return (
    <>
      {/* Pontos Transferidos + Custo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transferAmount">Pontos Transferidos</Label>
          <Input
            id="transferAmount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value;
              const paid =
                val && avgCostPerPoint > 0 ? (parseFloat(val) * avgCostPerPoint).toFixed(2) : "";
              set({ amount: val, amountPaid: paid });
              clearErr("amount");
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {sourceAccount && (
            <p
              className={`text-xs ${
                amountNum > sourceAccount.balance ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              Saldo disponível: {sourceAccount.balance.toLocaleString("pt-BR")} pontos
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="transferCost">Custo (calculado)</Label>
          <Input
            id="transferCost"
            type="number"
            step="0.01"
            value={form.amountPaid}
            disabled
            placeholder="R$ 0,00"
          />
          {sourceAccount && form.amount && avgCostPerPoint > 0 && (
            <p className="text-xs text-muted-foreground">
              {amountNum.toLocaleString("pt-BR")} pts × R$ {avgCostPerPoint.toFixed(4)} = R${" "}
              {calculatedCost.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Bonificação */}
      <div className="space-y-2">
        <Label htmlFor="transferBonus">Bonificação (%)</Label>
        <Input
          id="transferBonus"
          type="number"
          step="0.1"
          min="0"
          value={form.bonusPercent}
          onChange={(e) => set({ bonusPercent: e.target.value })}
          placeholder="Ex: 30"
        />
        {bonusNum > 0 && amountNum > 0 && (
          <p className="text-xs text-success">
            Milhas recebidas: {effectiveMiles.toLocaleString("pt-BR")} (
            {amountNum.toLocaleString("pt-BR")} + {bonusNum}%)
          </p>
        )}
      </div>
    </>
  );
}
