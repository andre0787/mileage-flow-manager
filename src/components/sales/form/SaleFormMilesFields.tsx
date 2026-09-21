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
import { emptyPassenger } from "./useSaleFormState";
import type { Client, SaleFormData } from "@/types";

interface StockInfoItem {
  accountId: string;
  ownerId: string;
  ownerName: string;
  accountName: string;
  programId: string;
  program: string;
  availableMiles: number;
  averageCostPerMile: number;
}

interface SaleFormMilesFieldsProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
  ownersList: string[];
  selectedOwnerStock: StockInfoItem[];
  selectedProgramStock?: StockInfoItem;
  effectiveAvailableMiles: number;
  additionalCostsTotal: number;
  clients: Client[];
  handlePassengerClientChange: (index: number, selectedClientId: string) => void;
  passengerLimitExceeded: boolean;
  maxPassengersAllowed?: number;
  usedPassengersInCycle: number;
  newPassengersCount: number;
  totalPassengersInCycle: number;
}

export function SaleFormMilesFields({
  form,
  update,
  ownersList,
  selectedOwnerStock,
  selectedProgramStock,
  effectiveAvailableMiles,
  additionalCostsTotal,
  clients,
  handlePassengerClientChange,
  passengerLimitExceeded,
  maxPassengersAllowed,
  usedPassengersInCycle,
  newPassengersCount,
  totalPassengersInCycle,
}: SaleFormMilesFieldsProps) {
  return (
    <>
      {/* Owner + Account */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Dono da Conta</Label>
          <Select
            value={form.ownerName}
            onValueChange={(v) =>
              update({ ownerName: v, accountId: "", accountName: "", program: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o dono" />
            </SelectTrigger>
            <SelectContent>
              {ownersList.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conta / Programa</Label>
          <Select
            value={form.accountId}
            onValueChange={(v) => {
              const s = selectedOwnerStock.find((x) => x.accountId === v);
              update({
                accountId: v,
                accountName: s?.accountName ?? "",
                program: s?.program ?? "",
              });
            }}
            disabled={!form.ownerName}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {selectedOwnerStock.map((s) => (
                <SelectItem key={s.accountId} value={s.accountId}>
                  {s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")} milhas)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stock info */}
      {selectedProgramStock && (
        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Milhas disponíveis:</span>
              <p className="font-semibold">
                {selectedProgramStock.availableMiles.toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Custo médio por milha:</span>
              <p className="font-semibold">
                R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Miles + Price + Value */}
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
              <p className="text-xs text-destructive">
                Quantidade superior ao estoque disponível
              </p>
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

      {/* Custos Adicionais dinâmicos */}
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
                additionalCosts: [...(form.additionalCosts ?? []), { desc: "", amount: "" }],
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar custo
          </Button>
        </div>
        {(form.additionalCosts ?? []).map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input
              type="number"
              step="0.01"
              value={c.amount}
              onChange={(e) =>
                update({
                  additionalCosts: (form.additionalCosts ?? []).map((x, j) =>
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
                  additionalCosts: (form.additionalCosts ?? []).map((x, j) =>
                    j === i ? { ...x, desc: e.target.value } : x,
                  ),
                })
              }
              placeholder="Ex: Taxa de embarque"
              aria-label={`Descrição do custo adicional ${i + 1}`}
            />
            {(form.additionalCosts ?? []).length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-[44px] min-w-[44px]"
                onClick={() =>
                  update({
                    additionalCosts: (form.additionalCosts ?? []).filter((_, j) => j !== i),
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

      {/* Passengers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Passageiros no Bilhete</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-[44px]"
            onClick={() => update({ passengers: [...form.passengers, emptyPassenger()] })}
          >
            Adicionar
          </Button>
        </div>
        {form.passengers.map((p, i) => (
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
                  passengers: form.passengers.map((x, j) =>
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
                  passengers: form.passengers.map((x, j) =>
                    j === i ? { ...x, cpf: e.target.value } : x,
                  ),
                })
              }
            />
            {form.passengers.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-[44px] min-w-[44px]"
                onClick={() =>
                  update({ passengers: form.passengers.filter((_, j) => j !== i) })
                }
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
