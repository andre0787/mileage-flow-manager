import type { EntryFormData } from "@/types";

export type EntryFormErrors = Partial<Record<string, string>>;

export const emptyEntryForm: EntryFormData = {
  accountId: "",
  origemTypeId: "",
  amount: "",
  amountPaid: "",
  conversionRate: "",
  sourceAccountId: "",
  bonusPercent: "",
  cartAmount: "",
  cartCost: "",
  date: "",
  isClube: false,
  clubeMeses: "",
  isRecurrent: false,
  recurrenceType: "monthly",
  recurrenceCount: 1,
  startDate: "",
  recurrenceValueMode: "split",
};

export function validateEntryForm(form: EntryFormData): EntryFormErrors {
  const errs: EntryFormErrors = {};
  if (!form.accountId) errs.accountId = "Selecione uma conta";
  if (!form.origemTypeId) errs.origemTypeId = "Selecione o tipo de origem";
  if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Informe a quantidade";
  if (!form.amountPaid || parseFloat(form.amountPaid) <= 0)
    errs.amountPaid = "Informe o valor pago";
  if (!form.date) errs.date = "Selecione a data";
  if (form.isRecurrent) {
    if (form.recurrenceCount < 2)
      errs.recurrenceCount = "Mínimo de 2 parcelas para gerar recorrência";
    if (!form.startDate) errs.startDate = "Selecione a data de início";
  }
  return errs;
}
