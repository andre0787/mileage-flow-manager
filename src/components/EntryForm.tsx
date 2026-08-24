import { useActionState, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntryCreateDrawers } from "@/components/entry/EntryCreateDrawers";
import { isTransferencia } from "@/lib/utils";
import { parseDateOnly } from "@/lib/dateUtils";
import { parseOrigemTypeDescription, filterToCleanOrigemTypes } from "@/lib/origemTypes";
import { classifyByText, categoryLabel, categoryColor } from "@/lib/auto-classify";
import { emptyEntryForm, validateEntryForm } from "@/lib/entryFormValidation";
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";

interface EntryFormProps {
  type: "milhas" | "pontos";
  mode: "create" | "edit";
  initialData?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
  accounts: Account[];
  origemTypes: OrigemType[];
  programs: Program[];
  owners: Owner[];
  onCreateOrigemType?: (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
  }) => Promise<string | undefined>;
  onCreateAccount?: (data: {
    name: string;
    ownerId: string;
    programId: string;
  }) => Promise<string | undefined>;
  onCreateOwner?: (data: {
    name: string;
    cpf?: string;
    phone?: string;
  }) => Promise<string | undefined>;
  onCreateProgram?: (data: {
    name: string;
    type: "pontos" | "milhas";
  }) => Promise<string | undefined>;
}

export function EntryForm({
  type,
  mode,
  initialData,
  onSubmit,
  onCancel,
  accounts,
  origemTypes,
  programs,
  owners,
  onCreateOrigemType,
  onCreateAccount,
  onCreateOwner,
  onCreateProgram,
}: EntryFormProps) {
  const initialForm = { ...emptyEntryForm, ...initialData };
  const [form, setForm] = useState<EntryFormData>(() => ({
    ...initialForm,
    startDate: initialForm.startDate || initialForm.date,
  }));
  const recurrenceStartWasEdited = useRef(
    Boolean(initialForm.startDate && initialForm.startDate !== initialForm.date),
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isOrigemTypeOpen, setIsOrigemTypeOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const set = (patch: Partial<EntryFormData>) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.date !== undefined && !recurrenceStartWasEdited.current) {
        next.startDate = next.date;
      }
      return next;
    });
  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const availableAccounts = accounts.filter((a) => a.type === type && a.status === "ativa");
  const currentOrigemTypes = filterToCleanOrigemTypes(
    origemTypes.filter((ot) => ot.accountType === type && !isTransferencia(ot)),
  );
  const selectedOrigemType = origemTypes.find((ot) => ot.id === form.origemTypeId);
  const selectedOrigemTypeHasRecurrence = selectedOrigemType
    ? parseOrigemTypeDescription(selectedOrigemType.description).hasRecurrence
    : false;

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;

  const label = type === "milhas" ? "Milhas" : "Pontos";

  const validate = (): boolean => {
    const errs = validateEntryForm(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // React 19 form action (rule-45): submit via <form action> — o botão deriva
  // pending de useFormStatus, sem estado de carregamento manual.
  const [, formAction] = useActionState(
    async () => {
      if (!validate()) return { ok: false };
      onSubmit(form);
      return { ok: true };
    },
    { ok: false },
  );

  const amountNum = parseFloat(form.amount || "0");
  const amountPaidNum = parseFloat(form.amountPaid || "0");
  const milesGenerated = amountNum * parseFloat(form.conversionRate || "1");
  const costPerMile = amountPaidNum / (milesGenerated || 1);
  // ponytail: guarda contra amount = 0 (Infinity/NaN no preview)
  const costPerThousand = amountNum > 0 ? (amountPaidNum / amountNum) * 1000 : 0;

  return (
    <form className="grid gap-4 py-4" action={formAction}>
      {/* Conta */}
      <div className="space-y-2">
        <Label htmlFor="entryAccount">Conta</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={form.accountId}
              onValueChange={(value) => {
                set({ accountId: value });
                clearErr("accountId");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({ownerName(acc.ownerId)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "create" && onCreateAccount && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Adicionar conta"
              onClick={() => setIsAccountOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
      </div>

      {/* Tipo de Origem */}
      <div className="space-y-2">
        <Label htmlFor="entryType">Tipo de Origem</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={form.origemTypeId}
              onValueChange={(value) => {
                const selected = origemTypes.find((ot) => ot.id === value);
                const hasRecurrence = selected
                  ? parseOrigemTypeDescription(selected.description).hasRecurrence
                  : false;
                set({
                  origemTypeId: value,
                  isRecurrent: hasRecurrence,
                  recurrenceCount: hasRecurrence ? Math.max(form.recurrenceCount, 2) : 1,
                  startDate: hasRecurrence
                    ? recurrenceStartWasEdited.current
                      ? form.startDate
                      : form.date
                    : form.date,
                });
                if (!hasRecurrence) recurrenceStartWasEdited.current = false;
                clearErr("origemTypeId");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {currentOrigemTypes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "create" && onCreateOrigemType && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Adicionar tipo de origem"
              onClick={() => setIsOrigemTypeOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {errors.origemTypeId && <p className="text-xs text-destructive">{errors.origemTypeId}</p>}
      </div>

      {selectedAccount && (
        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
          <div>
            <span className="text-muted-foreground">Programa: </span>
            <span className="font-medium">{programName(selectedAccount.programId)}</span>
          </div>
          {form.origemTypeId &&
            (() => {
              const ot = origemTypes.find((t) => t.id === form.origemTypeId);
              if (!ot) return null;
              const classification = classifyByText(ot.name + " " + (ot.description || ""));
              if (classification.category === "desconhecido") return null;
              return (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Classificação: </span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: categoryColor(classification.category) + "20",
                      color: categoryColor(classification.category),
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: categoryColor(classification.category) }}
                    />
                    {categoryLabel(classification.category)}
                  </span>
                </div>
              );
            })()}
        </div>
      )}

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="entryDate">Data</Label>
        <Input
          id="entryDate"
          type="date"
          value={form.date}
          onChange={(e) => {
            set({ date: e.target.value });
            clearErr("date");
          }}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
      </div>

      {/* Quantidade + Valor Pago */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">{label} Adquiridos</Label>
          <Input
            id="amount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              set({ amount: e.target.value });
              clearErr("amount");
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amountPaid">Valor Pago (R$)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={form.amountPaid}
            onChange={(e) => {
              set({ amountPaid: e.target.value });
              clearErr("amountPaid");
            }}
            placeholder="Ex: 450.00"
          />
          {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
        </div>
      </div>

      {/* Recorrência */}
      <div className="space-y-4">
        {selectedOrigemTypeHasRecurrence && (
          <p className="text-sm text-primary">
            Recorrência ativada pelo tipo de origem selecionado
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isRecurrent}
            onChange={(e) => {
              const isRecurrent = e.target.checked;
              if (!isRecurrent) recurrenceStartWasEdited.current = false;
              set({
                isRecurrent,
                recurrenceCount: isRecurrent ? form.recurrenceCount : 1,
                startDate: isRecurrent
                  ? recurrenceStartWasEdited.current
                    ? form.startDate
                    : form.date
                  : form.date,
              });
            }}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label className="text-sm font-medium">Habilitar recorrência</Label>
        </div>
        {form.isRecurrent && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de recorrência</Label>
                <Select
                  value={form.recurrenceType}
                  onValueChange={(value) =>
                    set({ recurrenceType: value as EntryFormData["recurrenceType"] })
                  }
                >
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
                <Input
                  type="number"
                  min="2"
                  placeholder="Ex: 12"
                  value={String(form.recurrenceCount)}
                  onChange={(e) => {
                    const val = Math.max(2, parseInt(e.target.value) || 1);
                    set({ recurrenceCount: val });
                    clearErr("recurrenceCount");
                  }}
                  className="w-20"
                />
                {errors.recurrenceCount && (
                  <p className="text-xs text-destructive">{errors.recurrenceCount}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => {
                    recurrenceStartWasEdited.current = true;
                    set({ startDate: e.target.value });
                    clearErr("startDate");
                  }}
                />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Modo de repetição</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recurrenceValueMode"
                    checked={form.recurrenceValueMode === "split"}
                    onChange={() => set({ recurrenceValueMode: "split" })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Parcelado (valor / parcelas)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recurrenceValueMode"
                    checked={form.recurrenceValueMode === "repeat"}
                    onChange={() => set({ recurrenceValueMode: "repeat" })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Repetido (mesmo valor em cada)</span>
                </label>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span>
                    {form.recurrenceType === "monthly"
                      ? "Mensal"
                      : form.recurrenceType === "quarterly"
                        ? "Trimestral"
                        : form.recurrenceType === "semiannual"
                          ? "Semestral"
                          : "Anual"}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Parcelas:</span>
                  <span>{form.recurrenceCount}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Início:</span>
                  <span>{form.startDate}</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-primary">
                  <span>Dia do mês:</span>
                  <span>
                    {form.startDate ? parseDateOnly(form.startDate).getDate() + "º dia" : "—"}
                  </span>
                </div>
                {form.recurrenceValueMode === "split" && (
                  <div className="flex justify-between mt-1">
                    <span>Valor por parcela:</span>
                    <span>
                      R$ {(parseFloat(form.amountPaid) / form.recurrenceCount).toFixed(2)}
                    </span>
                  </div>
                )}
                {form.recurrenceValueMode === "repeat" && (
                  <div className="flex justify-between mt-1">
                    <span>Valor por parcela:</span>
                    <span>R$ {parseFloat(form.amountPaid).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Taxa de Conversão (só para Pontos) */}
      {type === "pontos" && (
        <div className="space-y-2">
          <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
          <Input
            id="conversion"
            type="number"
            step="0.01"
            value={form.conversionRate}
            onChange={(e) => set({ conversionRate: e.target.value })}
            placeholder="Ex: 1.0"
          />
        </div>
      )}

      {/* Cálculos Automáticos */}
      {form.amount && form.amountPaid && (
        <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
          <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
          <div
            className={
              type === "pontos"
                ? "grid grid-cols-3 gap-4 text-xs"
                : "grid grid-cols-2 gap-4 text-xs"
            }
          >
            <div>
              <span className="text-muted-foreground">Custo por milhar:</span>
              <p className="font-semibold">R$ {costPerThousand.toFixed(2)}</p>
            </div>
            {type === "pontos" && (
              <div>
                <span className="text-muted-foreground">Milhas geradas:</span>
                <p className="font-semibold">{milesGenerated.toLocaleString("pt-BR")}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Custo por milha:</span>
              <p className="font-semibold">R$ {costPerMile.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <FormSubmitButton className="bg-gradient-primary hover:opacity-90">
          {mode === "create" ? "Registrar Entrada" : "Salvar Alterações"}
        </FormSubmitButton>
      </div>

      {/* Drawers de criação (Conta, Dono, Programa, Tipo de Origem) */}
      <EntryCreateDrawers
        type={type}
        owners={owners}
        programs={programs}
        origemTypeOpen={isOrigemTypeOpen}
        onOrigemTypeOpenChange={setIsOrigemTypeOpen}
        accountOpen={isAccountOpen}
        onAccountOpenChange={setIsAccountOpen}
        onOrigemTypeCreated={(id) => set({ origemTypeId: id })}
        onAccountCreated={(id) => set({ accountId: id })}
        onCreateOrigemType={onCreateOrigemType}
        onCreateAccount={onCreateAccount}
        onCreateOwner={onCreateOwner}
        onCreateProgram={onCreateProgram}
      />
    </form>
  );
}
