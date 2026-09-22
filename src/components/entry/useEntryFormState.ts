import { useRef, useState } from "react";
import { emptyEntryForm } from "@/lib/entryFormValidation";
import type { Account, EntryFormData } from "@/types";

interface UseEntryFormStateParams {
  type: "milhas" | "pontos";
  mode: "create" | "edit";
  initialData?: Partial<EntryFormData>;
  accounts: Account[];
}

export function useEntryFormState({ type, mode, initialData, accounts }: UseEntryFormStateParams) {
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

  const [formType, setFormType] = useState<"pontos" | "milhas">(() => {
    if (mode === "edit") {
      const fromAccount = initialData?.accountId
        ? accounts.find((a) => a.id === initialData.accountId)?.type
        : undefined;
      if (fromAccount) return fromAccount;
    }
    return type;
  });

  const switchFormType = (next: "pontos" | "milhas") => {
    if (next === formType) return;
    setFormType(next);
    setForm((prev) => ({ ...prev, accountId: "", origemTypeId: "" }));
    setErrors({});
  };

  const set = (patch: Partial<EntryFormData>) =>
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.date !== undefined && !recurrenceStartWasEdited.current) {
        next.startDate = next.date;
      }
      return next;
    });

  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const handleToggleRecurrence = (isRecurrent: boolean) => {
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
  };

  return {
    form,
    setForm,
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
  };
}
