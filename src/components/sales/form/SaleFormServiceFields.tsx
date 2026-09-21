import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaleFormData } from "@/types";

interface SaleFormServiceFieldsProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
}

export function SaleFormServiceFields({ form, update }: SaleFormServiceFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de serviço</Label>
          <Select
            value={form.serviceType}
            onValueChange={(v) => update({ serviceType: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultoria">Consultoria</SelectItem>
              <SelectItem value="taxa">Taxa de embarque</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.saleValue}
            onChange={(e) => update({ saleValue: e.target.value })}
            placeholder="Ex: 500.00"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={form.observations}
          onChange={(e) => update({ observations: e.target.value.slice(0, 500) })}
          placeholder="Ex: Sessão de consultoria de 2h sobre..."
          maxLength={500}
        />
      </div>
    </>
  );
}
