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
import { isValidISODate, todayISODate } from "@/lib/dateUtils";
import type { Client, SaleFormData } from "@/types";

interface SaleFormCommonFieldsProps {
  form: SaleFormData;
  update: (partial: Partial<SaleFormData>) => void;
  clients: Client[];
  isServico: boolean;
  onOpenClientDialog: () => void;
}

export function SaleFormCommonFields({
  form,
  update,
  clients,
  isServico,
  onOpenClientDialog,
}: SaleFormCommonFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={form.clientId}
                onValueChange={(v) => {
                  const c = clients.find((x) => x.id === v);
                  update({ clientId: v, clientName: c?.name || "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onOpenClientDialog}
              title="Novo cliente"
              aria-label="Novo cliente"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isServico && (
          <div className="space-y-2">
            <Label>Localizador do Bilhete</Label>
            <Input
              value={form.ticketLocator}
              onChange={(e) => update({ ticketLocator: e.target.value })}
              placeholder="Ex: ABC123"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data da venda</Label>
          <Input
            type="date"
            required
            value={form.date}
            max={todayISODate()}
            onChange={(e) => update({ date: e.target.value })}
            aria-label="Data da venda"
          />
          {form.date.trim() !== "" && !isValidISODate(form.date) && (
            <p className="text-xs text-destructive">Informe uma data válida.</p>
          )}
        </div>
      </div>
    </>
  );
}
