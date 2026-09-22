import { useActionState, useMemo, useState } from "react";
import { isTransferencia } from "@/lib/utils";
import { computeTransferCalc } from "@/lib/transferCalc";
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types";

export interface UseTransferFormProps {
  mode: "create" | "edit";
  initialData?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
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

export function useTransferForm({
  mode,
  initialData,
  onSubmit,
  accounts,
  origemTypes,
  programs,
  owners,
}: UseTransferFormProps) {
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
  const cartCostNum = parseFloat(form.cartCost || "0");
  const bonusNum = parseFloat(form.bonusPercent || "0");
  const calculatedCost = amountNum * avgCostPerPoint;
  // Port do PR #655: em create, se amountPaid vazio/zero, usa o custo calculado
  // (evita NaN/0 e mantém o preview refletindo a realidade enquanto o usuário digita).
  const baseAmountPaid =
    mode === "create" && (!form.amountPaid || form.amountPaid === "0")
      ? calculatedCost
      : parseFloat(form.amountPaid || "0");

  const calc = computeTransferCalc({
    amount: amountNum,
    cartAmount: cartAmountNum,
    amountPaid: baseAmountPaid,
    cartCost: cartAmountNum > 0 || cartCostNum > 0 ? cartCostNum : 0,
    conversionRate: 1 + bonusNum / 100,
    bonusPercent: bonusNum,
  });
  const effectiveMiles = calc.milesGenerated;

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

  const [, formAction] = useActionState(
    async () => {
      if (!validate()) return { ok: false };
      onSubmit({
        ...form,
        amountPaid:
          mode === "create" && (!form.amountPaid || form.amountPaid === "0")
            ? String(calculatedCost)
            : form.amountPaid,
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
      return { ok: true };
    },
    { ok: false },
  );

  return {
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
    baseAmountPaid,
    calc,
    effectiveMiles,
    ownerName,
    programName,
    formAction,
  };
}
