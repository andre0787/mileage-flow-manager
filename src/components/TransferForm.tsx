import { useState, useMemo } from "react";
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
import { isTransferencia } from "@/lib/utils";
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";

interface TransferFormProps {
  mode: "create" | "edit";
  initialData?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
  accounts: Account[];
  origemTypes: OrigemType[];
  programs: Program[];
  owners: Owner[];
}

const defaultForm = {
  accountId: "",
  origemTypeId: "",
  sourceAccountId: "",
  amount: "",
  amountPaid: "",
  bonusPercent: "",
  cartAmount: "",
  cartCost: "",
  date: "",
};

export function TransferForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  accounts,
  origemTypes,
  programs,
  owners,
}: TransferFormProps) {
  const transferType = useMemo(() => origemTypes.find(isTransferencia), [origemTypes]);

  const [form, setForm] = useState({
    ...defaultForm,
    origemTypeId: transferType?.id ?? "",
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (patch: Record<string, string>) => setForm((prev) => ({ ...prev, ...patch }));
  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const sourceAccount = accounts.find((a) => a.id === form.sourceAccountId);
  const sourceAccounts = accounts.filter((a) => a.type === "pontos" && a.status === "ativa");
  const destAccounts = accounts.filter(
    (a) =>
      a.type === "milhas" &&
      a.status === "ativa" &&
      (!form.sourceAccountId || a.ownerId === sourceAccount?.ownerId),
  );

  const avgCostPerPoint =
    sourceAccount && sourceAccount.balance > 0
      ? (sourceAccount.totalInvested ?? 0) / sourceAccount.balance
      : 0;

  const amountNum = parseFloat(form.amount || "0");
  const cartAmountNum = parseFloat(form.cartAmount || "0");
  const bonusNum = parseFloat(form.bonusPercent || "0");
  const effectiveMiles = (amountNum + cartAmountNum) * (1 + bonusNum / 100);
  const calculatedCost = amountNum * avgCostPerPoint;

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.accountId) errs.accountId = "Selecione a conta de destino";
    if (!form.sourceAccountId) errs.sourceAccountId = "Selecione a conta de origem";
    if (!form.amount || amountNum <= 0) errs.amount = "Informe a quantidade";
    if (sourceAccount && form.amount && amountNum > sourceAccount.balance)
      errs.amount = "Saldo insuficiente na conta de origem";
    if (!form.date) errs.date = "Selecione a data";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // Fill in defaults for EntryFormData fields not used by TransferForm
    onSubmit({
      ...form,
      origemTypeId: transferType?.id ?? form.origemTypeId,
      conversionRate: "",
      isClube: false,
      clubeMeses: "",
      isRecurrent: false,
      recurrenceType: "monthly",
      recurrenceCount: 1,
      startDate: "",
      recurrenceValueMode: "split",
    });
  };

  if (!transferType) {
    return (
      <div className="p-4 text-sm text-destructive">
        Tipo de origem "Transferência" não encontrado. Crie um tipo de origem com nome
        "Transferência" e tipo "milhas" nas Configurações.
      </div>
    );
  }

  return (
    <div className="grid gap-4 py-4">
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

      {/* Pontos Transferidos + Custo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transferAmount">Pontos Transferidos</Label>
          <Input
            id="transferAmount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value;
              const paid =
                val && avgCostPerPoint > 0 ? (parseFloat(val) * avgCostPerPoint).toFixed(2) : "";
              set({ amount: val, amountPaid: paid });
              clearErr("amount");
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {sourceAccount && (
            <p
              className={`text-xs ${amountNum > sourceAccount.balance ? "text-destructive" : "text-muted-foreground"}`}
            >
              Saldo disponível: {sourceAccount.balance.toLocaleString("pt-BR")} pontos
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="transferCost">Custo (calculado)</Label>
          <Input
            id="transferCost"
            type="number"
            step="0.01"
            value={form.amountPaid}
            disabled
            placeholder="R$ 0,00"
          />
          {sourceAccount && form.amount && avgCostPerPoint > 0 && (
            <p className="text-xs text-muted-foreground">
              {amountNum.toLocaleString("pt-BR")} pts × R$ {avgCostPerPoint.toFixed(4)} = R${" "}
              {calculatedCost.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Bonificação */}
      <div className="space-y-2">
        <Label htmlFor="transferBonus">Bonificação (%)</Label>
        <Input
          id="transferBonus"
          type="number"
          step="0.1"
          min="0"
          value={form.bonusPercent}
          onChange={(e) => set({ bonusPercent: e.target.value })}
          placeholder="Ex: 30"
        />
        {bonusNum > 0 && amountNum > 0 && (
          <p className="text-xs text-success">
            Milhas recebidas: {effectiveMiles.toLocaleString("pt-BR")} (
            {amountNum.toLocaleString("pt-BR")} + {bonusNum}%)
          </p>
        )}
      </div>

      {/* Compra no Carrinho */}
      <div className="border border-dashed border-primary/20 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          <Label className="font-semibold text-sm cursor-pointer">
            Compra no Carrinho <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Pontos Extras</Label>
            <Input
              type="number"
              value={form.cartAmount}
              onChange={(e) => set({ cartAmount: e.target.value })}
              placeholder="Ex: 10000"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Valor Total (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.cartCost}
              onChange={(e) => set({ cartCost: e.target.value })}
              placeholder="Ex: 200.00"
            />
          </div>
        </div>
        {cartAmountNum > 0 && (
          <p className="text-xs text-muted-foreground">
            +{cartAmountNum.toLocaleString("pt-BR")} pts × {bonusNum}% bônus ={" "}
            {(cartAmountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
              maximumFractionDigits: 0,
            })}{" "}
            milhas geradas
          </p>
        )}
      </div>

      {/* Cálculos Automáticos */}
      {form.amount && (
        <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
          <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Custo por milhar:</span>
              <p className="font-semibold">
                R${" "}
                {(
                  (calculatedCost / (effectiveMiles > 0 ? effectiveMiles : amountNum)) *
                  1000
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Milhas recebidas:</span>
              <p className="font-semibold text-success">{effectiveMiles.toLocaleString("pt-BR")}</p>
              {cartAmountNum > 0 && (
                <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
                  <p>
                    Da transferência:{" "}
                    {(amountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p>
                    Do carrinho:{" "}
                    {(cartAmountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Custo por milha:</span>
              <p className="font-semibold">
                R$ {(calculatedCost / (effectiveMiles > 0 ? effectiveMiles : 1)).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
          {mode === "create" ? "Registrar Transferência" : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
