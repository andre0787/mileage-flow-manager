import { useActionState } from "react";
import { EntryFormFields } from "@/components/entry/EntryFormFields";
import { useEntryFormState } from "@/components/entry/useEntryFormState";
import { useEntryOrigemTypeHandler } from "@/components/entry/useEntryOrigemTypeHandler";
import { useEntryFormDerived } from "@/components/entry/useEntryFormDerived";
import { validateEntryForm } from "@/lib/entryFormValidation";
import type { EntryFormProps } from "@/components/entry/types";

export function EntryForm(props: EntryFormProps) {
  const {
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
  } = props;

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

  const {
    selectedAccount,
    availableAccounts,
    currentOrigemTypes,
    selectedOrigemTypeHasRecurrence,
    label,
  } = useEntryFormDerived({ accounts, origemTypes, formType, form });

  const handleOrigemTypeChange = useEntryOrigemTypeHandler({
    origemTypes,
    formDate: form.date,
    formStartDate: form.startDate,
    formRecurrenceCount: form.recurrenceCount,
    recurrenceStartWasEdited,
    set,
    clearErr,
  });

  const [, formAction] = useActionState(
    async () => {
      const errs = validateEntryForm(form);
      setErrors(errs);
      if (Object.keys(errs).length === 0) {
        onSubmit(form);
        return { ok: true };
      }
      return { ok: false };
    },
    { ok: false },
  );

  return (
    <form className="grid gap-4 py-4" action={formAction}>
      <EntryFormFields
        mode={mode}
        formType={formType}
        onSwitchFormType={switchFormType}
        form={form}
        errors={errors}
        set={set}
        clearErr={clearErr}
        availableAccounts={availableAccounts}
        owners={owners}
        onCreateAccount={onCreateAccount}
        setIsAccountOpen={setIsAccountOpen}
        currentOrigemTypes={currentOrigemTypes}
        onCreateOrigemType={onCreateOrigemType}
        onOrigemTypeChange={handleOrigemTypeChange}
        setIsOrigemTypeOpen={setIsOrigemTypeOpen}
        selectedAccount={selectedAccount}
        origemTypes={origemTypes}
        programs={programs}
        label={label}
        selectedOrigemTypeHasRecurrence={selectedOrigemTypeHasRecurrence}
        handleToggleRecurrence={handleToggleRecurrence}
        recurrenceStartWasEdited={recurrenceStartWasEdited}
        onCancel={onCancel}
        isOrigemTypeOpen={isOrigemTypeOpen}
        isAccountOpen={isAccountOpen}
        onCreateOwner={onCreateOwner}
        onCreateProgram={onCreateProgram}
      />
    </form>
  );
}
