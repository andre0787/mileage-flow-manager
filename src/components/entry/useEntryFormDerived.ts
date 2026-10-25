import { isTransferencia } from "@/lib/utils";
import { parseOrigemTypeDescription, filterToCleanOrigemTypes } from "@/lib/origemTypes";
import type { Account, OrigemType, EntryFormData } from "@/types";

interface UseEntryFormDerivedProps {
  accounts: Account[];
  origemTypes: OrigemType[];
  formType: "milhas" | "pontos";
  form: EntryFormData;
}

export function useEntryFormDerived({
  accounts,
  origemTypes,
  formType,
  form,
}: UseEntryFormDerivedProps) {
  const selectedAccount = accounts.find((a) => a.id === form.accountId);
  const availableAccounts = accounts.filter((a) => a.type === formType && a.status === "ativa");
  const currentOrigemTypes = filterToCleanOrigemTypes(
    origemTypes.filter((ot) => ot.accountType === formType && !isTransferencia(ot)),
  );
  const selectedOrigemType = origemTypes.find((ot) => ot.id === form.origemTypeId);
  const selectedOrigemTypeHasRecurrence = selectedOrigemType
    ? parseOrigemTypeDescription(selectedOrigemType.description).hasRecurrence
    : false;
  const label = formType === "milhas" ? "Milhas" : "Pontos";

  return {
    selectedAccount,
    availableAccounts,
    currentOrigemTypes,
    selectedOrigemTypeHasRecurrence,
    label,
  };
}
