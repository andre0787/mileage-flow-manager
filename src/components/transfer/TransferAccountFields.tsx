import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Account } from "@/types";

interface TransferAccountFieldsProps {
  sourceAccount: Account | undefined;
  sourceAccounts: Account[];
  destAccounts: Account[];
  form: { sourceAccountId: string; accountId: string; date: string };
  errors: Record<string, string>;
  set: (patch: Record<string, string>) => void;
  clearErr: (field: string) => void;
  ownerName: (id: string) => string;
  programName: (id: string) => string;
  avgCostPerPoint: number;
}

export function TransferAccountFields({
  sourceAccount,
  sourceAccounts,
  destAccounts,
  form,
  errors,
  set,
  clearErr,
  ownerName,
  programName,
  avgCostPerPoint,
}: TransferAccountFieldsProps) {
  return (
    <>
      {/* Conta de Origem (Pontos) */}
      <div className="space-y-2">
        <Label htmlFor="transferSource">Conta de Origem (Pontos)</Label>
        <Select
          value={form.sourceAccountId}
          onValueChange={(value) => {
            set({ sourceAccountId: value, amount: "", amountPaid: "" });
            clearErr("sourceAccountId");
          }}
        >
          <SelectTrigger id="transferSource">
            <SelectValue placeholder="Selecione a conta de pontos" />
          </SelectTrigger>
          <SelectContent>
            {sourceAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} ({acc.balance.toLocaleString("pt-BR")} pts) — {ownerName(acc.ownerId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sourceAccountId && (
          <p className="text-xs text-destructive">{errors.sourceAccountId}</p>
        )}
        {sourceAccount && (
          <p className="text-xs text-muted-foreground">
            Programa: {programName(sourceAccount.programId)} | Custo médio: R${" "}
            {avgCostPerPoint.toFixed(4)}/pt
          </p>
        )}
      </div>

      {/* Conta de Destino (Milhas) */}
      <div className="space-y-2">
        <Label htmlFor="transferDest">Conta de Destino (Milhas)</Label>
        <Select
          value={form.accountId}
          onValueChange={(value) => {
            set({ accountId: value });
            clearErr("accountId");
          }}
        >
          <SelectTrigger id="transferDest">
            <SelectValue placeholder="Selecione a conta de milhas" />
          </SelectTrigger>
          <SelectContent>
            {destAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} — {ownerName(acc.ownerId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
        {destAccounts.length === 0 && form.sourceAccountId && (
          <p className="text-xs text-amber-600">
            Nenhuma conta de milhas disponível para este proprietário.
          </p>
        )}
      </div>

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="transferDate">Data</Label>
        <Input
          id="transferDate"
          type="date"
          value={form.date}
          onChange={(e) => {
            set({ date: e.target.value });
            clearErr("date");
          }}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
      </div>
    </>
  );
}
