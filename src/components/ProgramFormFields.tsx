import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Program } from "@/types";

export interface ProgramFormData {
  name: string;
  type: Program["type"];
  maxPassengers: string;
  passengerCycleType: "none" | "anual" | "dias";
  passengerCycleDays: string;
}

interface ProgramFormFieldsProps {
  form: ProgramFormData;
  error: string;
  onChange: (updated: ProgramFormData) => void;
  onErrorClear: () => void;
}

export function ProgramFormFields({ form, error, onChange, onErrorClear }: ProgramFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="programName">Nome do Programa</Label>
        <Input
          id="programName"
          value={form.name}
          onChange={(e) => {
            onChange({ ...form, name: e.target.value });
            onErrorClear();
          }}
          placeholder="Ex: LATAM Pass"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="programType">Tipo</Label>
        <Select
          value={form.type}
          onValueChange={(value) => onChange({ ...form, type: value as Program["type"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pontos">Programa de Pontos</SelectItem>
            <SelectItem value="milhas">Programa de Milhas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="programCycle">Controle de Passageiros</Label>
        <Select
          value={form.passengerCycleType}
          onValueChange={(value) =>
            onChange({ ...form, passengerCycleType: value as "none" | "anual" | "dias" })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o controle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não Controlar</SelectItem>
            <SelectItem value="anual">Ciclo Anual</SelectItem>
            <SelectItem value="dias">Ciclo por Dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.passengerCycleType !== "none" && (
        <div className="space-y-2">
          <Label htmlFor="programMaxPassengers">Máx. Passageiros por Ciclo</Label>
          <Input
            id="programMaxPassengers"
            type="number"
            min="1"
            value={form.maxPassengers}
            onChange={(e) => onChange({ ...form, maxPassengers: e.target.value })}
            placeholder="Ex: 5"
          />
        </div>
      )}
      {form.passengerCycleType === "dias" && (
        <div className="space-y-2">
          <Label htmlFor="programCycleDays">Janela (dias)</Label>
          <Input
            id="programCycleDays"
            type="number"
            min="1"
            value={form.passengerCycleDays}
            onChange={(e) => onChange({ ...form, passengerCycleDays: e.target.value })}
            placeholder="Ex: 365"
          />
        </div>
      )}
    </div>
  );
}
