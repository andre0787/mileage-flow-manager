import { useState } from "react";
import { Edit } from "lucide-react";
import { useClientBalanceQuery } from "@/features/clientes/hooks";
import { useUpdateClientCreditDateMutation } from "@/hooks/useDatabase";
import { FormDrawer } from "@/components/FormDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateBR, isValidISODate } from "@/lib/dateUtils";
import { movementEffect } from "@/lib/clientCredits";

export function ClientCreditInfo({ clientId }: { clientId: string }) {
  const { balance, movements } = useClientBalanceQuery(clientId);
  const updateDateM = useUpdateClientCreditDateMutation();
  const [editing, setEditing] = useState<{ id: string; date: string } | null>(null);

  const handleSaveDate = () => {
    if (!editing || !isValidISODate(editing.date)) return;
    updateDateM.mutate(
      { id: editing.id, clientId, date: editing.date },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <>
      <p className="font-semibold tabular-nums">R$ {balance.toFixed(2)}</p>
      {movements.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Extrato</summary>
          <ul className="mt-1 space-y-0.5 text-left">
            {(() => {
              let running = 0;
              return movements.map((m) => {
                running += movementEffect(m);
                const advance = m.kind === "earn" && !m.saleId;
                return (
                  <li key={m.id} className="tabular-nums">
                    {m.kind === "earn" ? "+" : m.kind === "spend" ? "−" : "↩"} R${" "}
                    {m.amount.toFixed(2)}
                    <span className="ml-1 text-[10px] opacity-70">
                      {formatDateBR(m.createdAt)}
                      {m.note ? ` · ${m.note}` : advance ? " · adiantamento" : ""}
                    </span>
                    {advance && (
                      <button
                        type="button"
                        title="Editar data do adiantamento"
                        aria-label={`Editar data do adiantamento de R$ ${m.amount.toFixed(2)}`}
                        onClick={() => setEditing({ id: m.id, date: m.createdAt.slice(0, 10) })}
                        className="ml-1 inline-flex align-middle opacity-60 hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    )}
                    <span className="float-right opacity-70">= R$ {running.toFixed(2)}</span>
                  </li>
                );
              });
            })()}
          </ul>
        </details>
      )}
      <FormDrawer
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title="Editar data do adiantamento"
      >
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credit-date">Data do adiantamento</Label>
            <Input
              id="credit-date"
              type="date"
              value={editing?.date ?? ""}
              onChange={(e) =>
                setEditing((prev) => (prev ? { ...prev, date: e.target.value } : prev))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Só a data muda — valor e saldo derivado continuam iguais, e o extrato reordena pela nova
            data.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDate}
            disabled={!editing || !isValidISODate(editing.date) || updateDateM.isPending}
            className="bg-gradient-primary hover:opacity-90"
          >
            {updateDateM.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </FormDrawer>
    </>
  );
}
