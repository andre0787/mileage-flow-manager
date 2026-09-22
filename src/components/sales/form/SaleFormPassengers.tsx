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
import type { Client, SaleFormData } from "@/types";

interface SaleFormPassengersProps {
  passengers: SaleFormData["passengers"];
  clients: Client[];
  update: (partial: Partial<SaleFormData>) => void;
  handlePassengerClientChange: (index: number, selectedClientId: string) => void;
  passengerLimitExceeded: boolean;
  maxPassengersAllowed?: number;
  usedPassengersInCycle: number;
  newPassengersCount: number;
  totalPassengersInCycle: number;
}

export function SaleFormPassengers({
  passengers,
  clients,
  update,
  handlePassengerClientChange,
  passengerLimitExceeded,
  maxPassengersAllowed,
  usedPassengersInCycle,
  newPassengersCount,
  totalPassengersInCycle,
}: SaleFormPassengersProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Passageiros no Bilhete</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-[44px]"
            onClick={() =>
              update({
                passengers: [
                  ...passengers,
                  { name: "", passengerId: crypto.randomUUID(), cpf: "", clientId: undefined },
                ],
              })
            }
          >
            Adicionar
          </Button>
        </div>
        {passengers.map((p, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
            <Select
              value={p.clientId ?? ""}
              onValueChange={(v) => handlePassengerClientChange(i, v)}
            >
              <SelectTrigger className="w-24 text-xs">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__">— Manual —</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nome completo"
              value={p.name}
              onChange={(e) =>
                update({
                  passengers: passengers.map((x, j) =>
                    j === i ? { ...x, name: e.target.value } : x,
                  ),
                })
              }
            />
            <Input
              placeholder="ID Passageiro"
              value={p.passengerId}
              disabled
              className="bg-muted/30 text-muted-foreground text-xs"
            />
            <Input
              placeholder="CPF"
              value={p.cpf}
              onChange={(e) =>
                update({
                  passengers: passengers.map((x, j) =>
                    j === i ? { ...x, cpf: e.target.value } : x,
                  ),
                })
              }
            />
            {passengers.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-[44px] min-w-[44px]"
                onClick={() => update({ passengers: passengers.filter((_, j) => j !== i) })}
              >
                ×
              </Button>
            )}
          </div>
        ))}
      </div>

      {passengerLimitExceeded && maxPassengersAllowed && (
        <p className="text-xs text-destructive">
          Limite de {maxPassengersAllowed} passageiros excedido para este ciclo. Usados:{" "}
          {usedPassengersInCycle} + {newPassengersCount} novo(s) = {totalPassengersInCycle}
        </p>
      )}
    </>
  );
}
