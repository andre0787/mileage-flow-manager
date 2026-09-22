import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaleFormData } from "@/types";

interface SaleFormAdditionalCostsProps {
  additionalCosts: SaleFormData["additionalCosts"];
  update: (partial: Partial<SaleFormData>) => void;
  additionalCostsTotal: number;
}

export function SaleFormAdditionalCosts({
  additionalCosts,
  update,
  additionalCostsTotal,
}: SaleFormAdditionalCostsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Custos Adicionais</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-[44px]"
          onClick={() =>
            update({
              additionalCosts: [...(additionalCosts ?? []), { desc: "", amount: "" }],
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar custo
        </Button>
      </div>
      {(additionalCosts ?? []).map((c, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            type="number"
            step="0.01"
            value={c.amount}
            onChange={(e) =>
              update({
                additionalCosts: (additionalCosts ?? []).map((x, j) =>
                  j === i ? { ...x, amount: e.target.value } : x,
                ),
              })
            }
            placeholder="Ex: 50.00"
            aria-label={`Valor do custo adicional ${i + 1}`}
          />
          <Input
            value={c.desc}
            onChange={(e) =>
              update({
                additionalCosts: (additionalCosts ?? []).map((x, j) =>
                  j === i ? { ...x, desc: e.target.value } : x,
                ),
              })
            }
            placeholder="Ex: Taxa de embarque"
            aria-label={`Descrição do custo adicional ${i + 1}`}
          />
          {(additionalCosts ?? []).length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-[44px] min-w-[44px]"
              onClick={() =>
                update({
                  additionalCosts: (additionalCosts ?? []).filter((_, j) => j !== i),
                })
              }
              aria-label={`Remover custo adicional ${i + 1}`}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      {additionalCostsTotal > 0 && (
        <p className="text-xs text-muted-foreground">
          Total adicional: R$ {additionalCostsTotal.toFixed(2)}
        </p>
      )}
    </div>
  );
}
