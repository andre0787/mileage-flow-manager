import { FormDrawer } from "@/components/FormDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdvanceFormState {
  amount: string;
  note: string;
  date: string;
}

interface ClientAdvanceDrawerProps {
  client: { id: string; name: string } | null;
  onClose: () => void;
  advanceForm: AdvanceFormState;
  setAdvanceForm: React.Dispatch<React.SetStateAction<AdvanceFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export function ClientAdvanceDrawer({
  client,
  onClose,
  advanceForm,
  setAdvanceForm,
  onSubmit,
  isPending,
}: ClientAdvanceDrawerProps) {
  return (
    <FormDrawer
      open={client !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Registrar Adiantamento — ${client?.name ?? ""}`}
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="advance-amount">Valor recebido (R$)</Label>
          <Input
            id="advance-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={advanceForm.amount}
            onChange={(e) => setAdvanceForm((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advance-date">Data do pagamento</Label>
          <Input
            id="advance-date"
            type="date"
            value={advanceForm.date}
            onChange={(e) => setAdvanceForm((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="advance-note">Observação (origem do dinheiro)</Label>
          <Input
            id="advance-note"
            value={advanceForm.note}
            onChange={(e) => setAdvanceForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Ex.: PIX recebido — adiantamento"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          O valor entra como crédito do cliente no extrato e pode ser abatido automaticamente ao
          receber a emissão (venda).
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!advanceForm.amount || Number(advanceForm.amount) <= 0 || isPending}
          className="bg-gradient-primary hover:opacity-90"
        >
          {isPending ? "Registrando..." : "Registrar"}
        </Button>
      </div>
    </FormDrawer>
  );
}
