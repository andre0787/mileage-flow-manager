import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntryFormTypeToggle } from "@/components/entry/EntryFormTypeToggle";
import { EntryAccountSelect } from "@/components/entry/EntryAccountSelect";
import { EntryOrigemTypeSelect } from "@/components/entry/EntryOrigemTypeSelect";
import { EntryAccountInfo } from "@/components/entry/EntryAccountInfo";
import { EntryAmountFields } from "@/components/entry/EntryAmountFields";
import { EntryRecurrenceFields } from "@/components/entry/EntryRecurrenceFields";
import { EntryCalculationsCard } from "@/components/entry/EntryCalculationsCard";
import { EntryCreateDrawers } from "@/components/entry/EntryCreateDrawers";
import { useEntryFormState } from "@/components/entry/useEntryFormState";
import { useEntryOrigemTypeHandler } from "@/components/entry/useEntryOrigemTypeHandler";
import { isTransferencia } from "@/lib/utils";
import { parseOrigemTypeDescription, filterToCleanOrigemTypes } from "@/lib/origemTypes";
import { validateEntryForm } from "@/lib/entryFormValidation";
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
    accountType?: "pontos" | "milhas";
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
  const {
    form,
    recurrenceStartWasEdited,
    errors,
    setErrors,
    isOrigemTypeOpen,
    setIsOrigemTypeOpen,
    isAccountOpen,
    setIsAccountOpen,
    formType,
    switchFormType,
    set,
    clearErr,
    handleToggleRecurrence,
  } = useEntryFormState({ type, mode, initialData, accounts });

  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const availableAccounts = accounts.filter((a) => a.type === formType && a.status === "ativa");
  const currentOrigemTypes = filterToCleanOrigemTypes(
    origemTypes.filter((ot) => ot.accountType === formType && !isTransferencia(ot)),
  );
  const selectedOrigemType = origemTypes.find((ot) => ot.id === form.origemTypeId);
  const selectedOrigemTypeHasRecurrence = selectedOrigemType
    ? parseOrigemTypeDescription(selectedOrigemType.description).hasRecurrence
    : false;

  const handleOrigemTypeChange = useEntryOrigemTypeHandler({
    origemTypes,
    formDate: form.date,
    formStartDate: form.startDate,
    formRecurrenceCount: form.recurrenceCount,
    recurrenceStartWasEdited,
    set,
    clearErr,
  });

  const label = formType === "milhas" ? "Milhas" : "Pontos";

  const validate = (): boolean => {
    const errs = validateEntryForm(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [, formAction] = useActionState(
    async () => {
      if (!validate()) return { ok: false };
      onSubmit(form);
      return { ok: true };
    },
    { ok: false },
  );

  return (
    <form className="grid gap-4 py-4" action={formAction}>
      {mode === "create" && (
        <EntryFormTypeToggle formType={formType} onSwitchFormType={switchFormType} />
      )}

      <EntryAccountSelect
        accountId={form.accountId}
        availableAccounts={availableAccounts}
        owners={owners}
        mode={mode}
        error={errors.accountId}
        onCreateAccount={onCreateAccount}
        onSelectAccount={(val) => {
          set({ accountId: val });
          clearErr("accountId");
        }}
        onOpenAccountDrawer={() => setIsAccountOpen(true)}
      />

      <EntryOrigemTypeSelect
        origemTypeId={form.origemTypeId}
        currentOrigemTypes={currentOrigemTypes}
        mode={mode}
        error={errors.origemTypeId}
        onCreateOrigemType={onCreateOrigemType}
        onOrigemTypeChange={handleOrigemTypeChange}
        onOpenOrigemTypeDrawer={() => setIsOrigemTypeOpen(true)}
      />

      {selectedAccount && (
        <EntryAccountInfo
          selectedAccount={selectedAccount}
          origemTypeId={form.origemTypeId}
          origemTypes={origemTypes}
          programs={programs}
        />
      )}

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

      <EntryAmountFields
        label={label}
        formType={formType}
        amount={form.amount}
        amountPaid={form.amountPaid}
        conversionRate={form.conversionRate}
        errors={errors}
        onUpdateForm={set}
        onClearError={clearErr}
      />

      <EntryRecurrenceFields
        form={form}
        selectedOrigemTypeHasRecurrence={selectedOrigemTypeHasRecurrence}
        errors={errors}
        onToggleRecurrence={handleToggleRecurrence}
        onUpdateForm={set}
        onClearError={clearErr}
        onStartEdited={() => {
          recurrenceStartWasEdited.current = true;
        }}
      />

      <EntryCalculationsCard
        formType={formType}
        amount={form.amount}
        amountPaid={form.amountPaid}
        conversionRate={form.conversionRate}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <FormSubmitButton className="bg-gradient-primary hover:opacity-90">
          {mode === "create" ? "Registrar Entrada" : "Salvar Alterações"}
        </FormSubmitButton>
      </div>

      <EntryCreateDrawers
        type={formType}
        owners={owners}
        programs={programs}
        origemTypeOpen={isOrigemTypeOpen}
        onOrigemTypeOpenChange={setIsOrigemTypeOpen}
        accountOpen={isAccountOpen}
        onAccountOpenChange={setIsAccountOpen}
        onOrigemTypeCreated={(id) => set({ origemTypeId: id })}
        onAccountCreated={(id) => set({ accountId: id })}
        onCreateOrigemType={
          onCreateOrigemType
            ? (data) => onCreateOrigemType({ ...data, accountType: formType })
            : undefined
        }
        onCreateAccount={onCreateAccount}
        onCreateOwner={onCreateOwner}
        onCreateProgram={onCreateProgram}
      />
    </form>
  );
}
