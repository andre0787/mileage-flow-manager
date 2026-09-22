import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntryRecurrenceSummary } from "@/components/entry/EntryRecurrenceSummary";
import type { EntryFormData } from "@/types";

interface EntryRecurrenceFieldsProps {
  form: EntryFormData;
  selectedOrigemTypeHasRecurrence: boolean;
  errors: Partial<Record<string, string>>;
  onToggleRecurrence: (isRecurrent: boolean) => void;
  onUpdateForm: (patch: Partial<EntryFormData>) => void;
  onClearError: (field: string) => void;
  onStartEdited: () => void;
}

export function EntryRecurrenceFields({
  form,
  selectedOrigemTypeHasRecurrence,
  errors,
  onToggleRecurrence,
  onUpdateForm,
  onClearError,
  onStartEdited,
}: EntryRecurrenceFieldsProps) {
  return (
    <div className="space-y-4">
      {selectedOrigemTypeHasRecurrence && (
        <p className="text-sm text-primary">Recorrência ativada pelo tipo de origem selecionado</p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isRecurrent}
          onChange={(e) => onToggleRecurrence(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <Label className="text-sm font-medium">Habilitar recorrência</Label>
      </div>
      {form.isRecurrent && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de recorrência</Label>
              <Select
                value={form.recurrenceType}
                onValueChange={(value) =>
                  onUpdateForm({ recurrenceType: value as EntryFormData["recurrenceType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade de parcelas</Label>
              <Input
                type="number"
                min="2"
                placeholder="Ex: 12"
                value={String(form.recurrenceCount)}
                onChange={(e) => {
                  const val = Math.max(2, parseInt(e.target.value) || 1);
                  onUpdateForm({ recurrenceCount: val });
                  onClearError("recurrenceCount");
                }}
                className="w-20"
              />
              {errors.recurrenceCount && (
                <p className="text-xs text-destructive">{errors.recurrenceCount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => {
                  onStartEdited();
                  onUpdateForm({ startDate: e.target.value });
                  onClearError("startDate");
                }}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Modo de repetição</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceValueMode"
                  checked={form.recurrenceValueMode === "split"}
                  onChange={() => onUpdateForm({ recurrenceValueMode: "split" })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Parcelado (valor / parcelas)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recurrenceValueMode"
                  checked={form.recurrenceValueMode === "repeat"}
                  onChange={() => onUpdateForm({ recurrenceValueMode: "repeat" })}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Repetido (mesmo valor em cada)</span>
              </label>
            </div>
          </div>
          <EntryRecurrenceSummary
            recurrenceType={form.recurrenceType}
            recurrenceCount={form.recurrenceCount}
            startDate={form.startDate}
            recurrenceValueMode={form.recurrenceValueMode}
            amountPaid={form.amountPaid}
          />
        </div>
      )}
    </div>
  );
}
