import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaleFormData } from "@/types";
import type { StockInfoItem } from "./SaleFormOwnerAccount";

interface SaleFormMilesInputsProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
  selectedProgramStock?: StockInfoItem;
  effectiveAvailableMiles: number;
}

export function SaleFormMilesInputs({
  form,
  update,
  selectedProgramStock,
  effectiveAvailableMiles,
}: SaleFormMilesInputsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Milhas Utilizadas</Label>
        <Input
          type="number"
          value={form.milesUsed}
          onChange={(e) => {
            const v = e.target.value;
            update(
              v && form.pricePerMile
                ? {
                    milesUsed: v,
                    saleValue: (parseFloat(v) * parseFloat(form.pricePerMile)).toFixed(2),
                  }
                : { milesUsed: v },
            );
          }}
          placeholder="Ex: 50000"
          max={selectedProgramStock ? effectiveAvailableMiles : undefined}
        />
        {selectedProgramStock && (
          <p className="text-xs text-muted-foreground">
            Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas
          </p>
        )}
        {form.milesUsed &&
          selectedProgramStock &&
          parseFloat(form.milesUsed) > effectiveAvailableMiles && (
            <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
          )}
      </div>
      <div className="space-y-2">
        <Label>Valor por Milha (R$)</Label>
        <Input
          type="number"
          step="0.0001"
          value={form.pricePerMile}
          onChange={(e) => {
            const v = e.target.value;
            update(
              v && form.milesUsed
                ? {
                    pricePerMile: v,
                    saleValue: (parseFloat(v) * parseFloat(form.milesUsed)).toFixed(2),
                  }
                : { pricePerMile: v },
            );
          }}
          placeholder="Ex: 0.03"
        />
      </div>
      <div className="space-y-2">
        <Label>Valor da Venda (R$)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.saleValue}
          onChange={(e) => update({ saleValue: e.target.value })}
          placeholder="Ex: 300.00"
        />
        {form.pricePerMile && form.milesUsed && (
          <p className="text-xs text-muted-foreground">
            {parseFloat(form.milesUsed).toLocaleString("pt-BR")} × R${" "}
            {parseFloat(form.pricePerMile).toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
