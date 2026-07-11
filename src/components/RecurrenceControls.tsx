import { useState } from "react";
import { Check, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RecurrenceType = "none" | "monthly" | "quarterly" | "semiannual" | "annual";

interface RecurrenceControlsProps {
  /** When true, recurrence controls are enabled */
  isEnabled: boolean;
  /** Current recurrence type */
  type: RecurrenceType;
  /** Number of installments (>=1) */
  count: number;
  /** Start date (ISO string YYYY-MM-DD) */
  startDate: string;
  /** Setters */
  setEnabled: (enabled: boolean) => void;
  setType: (type: RecurrenceType) => void;
  setCount: (count: number) => void;
  setStartDate: (date: string) => void;
}

export function RecurrenceControls({
  isEnabled,
  type,
  count,
  startDate,
  setEnabled,
  setType,
  setCount,
  setStartDate,
}: RecurrenceControlsProps) {
  const handleToggle = () => setEnabled(!isEnabled);
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value as RecurrenceType);
  };
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setCount(val);
  };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium">Repetir pagamento</span>
        </label>
        {!isEnabled && (
          <span className="text-xs text-muted-foreground">
            Quando ativado, o valor e a quantidade serão divididos igualmente entre as parcelas.
          </span>
        )}
      </div>

      {isEnabled && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de recorrência</Label>
              <Select value={type} onChange={handleTypeChange}>
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
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={count}
                  onChange={handleCountChange}
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de início</Label>
              <Input type="date" value={startDate} onChange={handleDateChange} />
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 mt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Parcelas:</span>
              <span>{count}</span>
            </div>
            <div className="flex justify-between text-muted-foreground mt-1">
              <span>Tipo:</span>
              <span>
                {type === "monthly"
                  ? "Mensal"
                  : type === "quarterly"
                    ? "Trimestral"
                    : type === "semiannual"
                      ? "Semestral"
                      : "Anual"}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground mt-1">
              <span>Início:</span>
              <span>{startDate}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}