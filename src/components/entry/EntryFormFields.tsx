import { EntryFormTypeToggle } from "@/components/entry/EntryFormTypeToggle";
import { EntryAccountSelect } from "@/components/entry/EntryAccountSelect";
import { EntryOrigemTypeSelect } from "@/components/entry/EntryOrigemTypeSelect";
import { EntryAccountInfo } from "@/components/entry/EntryAccountInfo";
import { EntryDateField } from "@/components/entry/EntryDateField";
import { EntryAmountFields } from "@/components/entry/EntryAmountFields";
import { EntryRecurrenceFields } from "@/components/entry/EntryRecurrenceFields";
import { EntryCalculationsCard } from "@/components/entry/EntryCalculationsCard";
import { EntryFormActions } from "@/components/entry/EntryFormActions";
import { EntryCreateDrawers } from "@/components/entry/EntryCreateDrawers";
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";

interface EntryFormFieldsProps {
  mode: "create" | "edit";
  formType: "pontos" | "milhas";
  onSwitchFormType: (type: "pontos" | "milhas") => void;
  form: EntryFormData;
  errors: Partial<Record<string, string>>;
  set: (patch: Partial<EntryFormData>) => void;
  clearErr: (field: string) => void;
  availableAccounts: Account[];
  owners: Owner[];
  onCreateAccount?: (data: { name: string; ownerId: string; programId: string }) => Promise<string | undefined>;
  setIsAccountOpen: (open: boolean) => void;
  currentOrigemTypes: OrigemType[];
  onCreateOrigemType?: (data: { name: string; color: string; hasRecurrence: boolean; accountType?: "pontos" | "milhas" }) => Promise<string | undefined>;
  onOrigemTypeChange: (id: string) => void;
  setIsOrigemTypeOpen: (open: boolean) => void;
  selectedAccount?: Account;
  origemTypes: OrigemType[];
  programs: Program[];
  label: string;
  selectedOrigemTypeHasRecurrence: boolean;
  handleToggleRecurrence: (checked: boolean) => void;
  recurrenceStartWasEdited: React.MutableRefObject<boolean>;
  onCancel: () => void;
  isOrigemTypeOpen: boolean;
  isAccountOpen: boolean;
  onCreateOwner?: (data: { name: string; cpf?: string; phone?: string }) => Promise<string | undefined>;
  onCreateProgram?: (data: { name: string; type: "pontos" | "milhas" }) => Promise<string | undefined>;
}

export function EntryFormFields(p: EntryFormFieldsProps) {
  return (
    <>
      {p.mode === "create" && (
        <EntryFormTypeToggle formType={p.formType} onSwitchFormType={p.onSwitchFormType} />
      )}

      <EntryAccountSelect
        accountId={p.form.accountId}
        availableAccounts={p.availableAccounts}
        owners={p.owners}
        mode={p.mode}
        error={p.errors.accountId}
        onCreateAccount={p.onCreateAccount}
        onSelectAccount={(val) => {
          p.set({ accountId: val });
          p.clearErr("accountId");
        }}
        onOpenAccountDrawer={() => p.setIsAccountOpen(true)}
      />

      <EntryOrigemTypeSelect
        origemTypeId={p.form.origemTypeId}
        currentOrigemTypes={p.currentOrigemTypes}
        mode={p.mode}
        error={p.errors.origemTypeId}
        onCreateOrigemType={p.onCreateOrigemType}
        onOrigemTypeChange={p.onOrigemTypeChange}
        onOpenOrigemTypeDrawer={() => p.setIsOrigemTypeOpen(true)}
      />

      {p.selectedAccount && (
        <EntryAccountInfo
          selectedAccount={p.selectedAccount}
          origemTypeId={p.form.origemTypeId}
          origemTypes={p.origemTypes}
          programs={p.programs}
        />
      )}

      <EntryDateField
        date={p.form.date}
        error={p.errors.date}
        onChange={(val) => {
          p.set({ date: val });
          p.clearErr("date");
        }}
      />

      <EntryAmountFields
        label={p.label}
        formType={p.formType}
        amount={p.form.amount}
        amountPaid={p.form.amountPaid}
        conversionRate={p.form.conversionRate}
        errors={p.errors}
        onUpdateForm={p.set}
        onClearError={p.clearErr}
      />

      <EntryRecurrenceFields
        form={p.form}
        selectedOrigemTypeHasRecurrence={p.selectedOrigemTypeHasRecurrence}
        errors={p.errors}
        onToggleRecurrence={p.handleToggleRecurrence}
        onUpdateForm={p.set}
        onClearError={p.clearErr}
        onStartEdited={() => {
          p.recurrenceStartWasEdited.current = true;
        }}
      />

      <EntryCalculationsCard
        formType={p.formType}
        amount={p.form.amount}
        amountPaid={p.form.amountPaid}
        conversionRate={p.form.conversionRate}
      />

      <EntryFormActions mode={p.mode} onCancel={p.onCancel} />

      <EntryCreateDrawers
        type={p.formType}
        owners={p.owners}
        programs={p.programs}
        origemTypeOpen={p.isOrigemTypeOpen}
        onOrigemTypeOpenChange={p.setIsOrigemTypeOpen}
        accountOpen={p.isAccountOpen}
        onAccountOpenChange={p.setIsAccountOpen}
        onOrigemTypeCreated={(id) => p.set({ origemTypeId: id })}
        onAccountCreated={(id) => p.set({ accountId: id })}
        onCreateOrigemType={
          p.onCreateOrigemType
            ? (data) => p.onCreateOrigemType!({ ...data, accountType: p.formType })
            : undefined
        }
        onCreateAccount={p.onCreateAccount}
        onCreateOwner={p.onCreateOwner}
        onCreateProgram={p.onCreateProgram}
      />
    </>
  );
}
