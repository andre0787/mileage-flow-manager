import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Owner, Program } from "@/types";

export interface NewAccountState {
  name: string;
  ownerId: string;
  programId: string;
}

interface AccountDrawerFieldsProps {
  value: NewAccountState;
  onChange: (patch: Partial<NewAccountState>) => void;
  errors: Partial<Record<string, string>>;
  owners: Owner[];
  programs: Program[];
  canCreateOwner: boolean;
  canCreateProgram: boolean;
  onOpenOwner: () => void;
  onOpenProgram: () => void;
}

export function AccountDrawerFields({
  value,
  onChange,
  errors,
  owners,
  programs,
  canCreateOwner,
  canCreateProgram,
  onOpenOwner,
  onOpenProgram,
}: AccountDrawerFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Nome da Conta</Label>
        <Input
          value={value.name}
          onChange={(e) => {
            onChange({ name: e.target.value });
          }}
          placeholder="Ex: Conta Principal LATAM"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label>Dono</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={value.ownerId} onValueChange={(v) => onChange({ ownerId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dono" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canCreateOwner && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Adicionar dono"
              onClick={onOpenOwner}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {errors.ownerId && <p className="text-xs text-destructive">{errors.ownerId}</p>}
      </div>
      <div className="space-y-2">
        <Label>Programa</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={value.programId} onValueChange={(v) => onChange({ programId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o programa" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.type === "pontos" ? "Pontos" : "Milhas"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canCreateProgram && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Adicionar programa"
              onClick={onOpenProgram}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {errors.programId && <p className="text-xs text-destructive">{errors.programId}</p>}
      </div>
      {value.programId && (
        <div className="p-3 bg-muted/30 rounded-lg text-sm">
          <span className="text-muted-foreground">Tipo da conta: </span>
          <span className="font-medium">
            {programs.find((p) => p.id === value.programId)?.type === "pontos"
              ? "Pontos"
              : "Milhas"}
          </span>
        </div>
      )}
    </div>
  );
}
