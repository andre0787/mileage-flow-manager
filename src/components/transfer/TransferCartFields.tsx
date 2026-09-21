import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransferCartFieldsProps {
  form: { cartAmount: string; cartCost: string };
  set: (patch: Record<string, string>) => void;
  cartAmountNum: number;
  bonusNum: number;
}

export function TransferCartFields({
  form,
  set,
  cartAmountNum,
  bonusNum,
}: TransferCartFieldsProps) {
  return (
    <div className="border border-dashed border-primary/20 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold" />
        <Label className="font-semibold text-sm cursor-pointer">
          Compra no Carrinho <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Pontos Extras</Label>
          <Input
            type="number"
            value={form.cartAmount}
            onChange={(e) => set({ cartAmount: e.target.value })}
            placeholder="Ex: 10000"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor Total (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.cartCost}
            onChange={(e) => set({ cartCost: e.target.value })}
            placeholder="Ex: 200.00"
          />
        </div>
      </div>
      {cartAmountNum > 0 && (
        <p className="text-xs text-muted-foreground">
          +{cartAmountNum.toLocaleString("pt-BR")} pts × {bonusNum}% bônus ={" "}
          {(cartAmountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          })}{" "}
          milhas geradas
        </p>
      )}
    </div>
  );
}
