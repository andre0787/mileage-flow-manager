import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EntryAmountFieldsProps {
  label: string;
  formType: "pontos" | "milhas";
  amount: string;
  amountPaid: string;
  conversionRate: string;
  errors: Partial<Record<string, string>>;
  onUpdateForm: (patch: Partial<{ amount: string; amountPaid: string; conversionRate: string }>) => void;
  onClearError: (field: string) => void;
}

export function EntryAmountFields({
  label,
  formType,
  amount,
  amountPaid,
  conversionRate,
  errors,
  onUpdateForm,
  onClearError,
}: EntryAmountFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{label} Adquiridos</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => {
              onUpdateForm({ amount: e.target.value });
              onClearError("amount");
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amountPaid">Valor Pago (R$)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={amountPaid}
            onChange={(e) => {
              onUpdateForm({ amountPaid: e.target.value });
              onClearError("amountPaid");
            }}
            placeholder="Ex: 450.00"
          />
          {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
        </div>
      </div>

      {formType === "pontos" && (
        <div className="space-y-2">
          <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
          <Input
            id="conversion"
            type="number"
            step="0.01"
            value={conversionRate}
            onChange={(e) => onUpdateForm({ conversionRate: e.target.value })}
            placeholder="Ex: 1.0"
          />
        </div>
      )}
    </>
  );
}
