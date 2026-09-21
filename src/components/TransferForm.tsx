import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";
import { useTransferForm } from "./transfer/useTransferForm";
import { TransferAccountFields } from "./transfer/TransferAccountFields";
import { TransferAmountFields } from "./transfer/TransferAmountFields";
import { TransferCartFields } from "./transfer/TransferCartFields";
import { TransferCalculationsPreview } from "./transfer/TransferCalculationsPreview";

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
  // Action state management encapsulated in useTransferForm (uses useActionState)
  const {
    transferType,
    form,
    errors,
    set,
    clearErr,
    sourceAccount,
    sourceAccounts,
    destAccounts,
    avgCostPerPoint,
    amountNum,
    cartAmountNum,
    cartCostNum,
    bonusNum,
    calculatedCost,
    calc,
    effectiveMiles,
    ownerName,
    programName,
    formAction,
  } = useTransferForm({
    initialData,
    onSubmit,
    accounts,
    origemTypes,
    programs,
    owners,
  });

  if (!transferType) {
    return (
      <div className="p-4 text-sm text-destructive">
        Tipo de origem "Transferência" não encontrado. Crie um tipo de origem com nome
        "Transferência" e tipo "milhas" nas Configurações.
      </div>
    );
  }

  return (
    <form className="grid gap-4 py-4" action={formAction}>
      <TransferAccountFields
        sourceAccount={sourceAccount}
        sourceAccounts={sourceAccounts}
        destAccounts={destAccounts}
        form={form}
        errors={errors}
        set={set}
        clearErr={clearErr}
        ownerName={ownerName}
        programName={programName}
        avgCostPerPoint={avgCostPerPoint}
      />

      <TransferAmountFields
        sourceAccount={sourceAccount}
        form={form}
        errors={errors}
        set={set}
        clearErr={clearErr}
        avgCostPerPoint={avgCostPerPoint}
        amountNum={amountNum}
        bonusNum={bonusNum}
        calculatedCost={calculatedCost}
        effectiveMiles={effectiveMiles}
      />

      <TransferCartFields form={form} set={set} cartAmountNum={cartAmountNum} bonusNum={bonusNum} />

      <TransferCalculationsPreview
        amount={form.amount}
        amountPaid={form.amountPaid}
        calc={calc}
        effectiveMiles={effectiveMiles}
        amountNum={amountNum}
        bonusNum={bonusNum}
        cartAmountNum={cartAmountNum}
        cartCostNum={cartCostNum}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <FormSubmitButton className="bg-gradient-primary hover:opacity-90">
          {mode === "create" ? "Registrar Transferência" : "Salvar Alterações"}
        </FormSubmitButton>
      </div>
    </form>
  );
}
