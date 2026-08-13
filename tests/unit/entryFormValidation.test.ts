import { describe, it, expect } from "vitest";
import { emptyEntryForm, validateEntryForm } from "@/lib/entryFormValidation";
import type { EntryFormData } from "@/types";

const filled: EntryFormData = {
  ...emptyEntryForm,
  accountId: "a1",
  origemTypeId: "ot1",
  amount: "1000",
  amountPaid: "100",
  date: "2026-08-01",
};

describe("validateEntryForm", () => {
  it("rejeita formulário vazio com as mensagens esperadas", () => {
    const errs = validateEntryForm(emptyEntryForm);
    expect(errs).toMatchObject({
      accountId: "Selecione uma conta",
      origemTypeId: "Selecione o tipo de origem",
      amount: "Informe a quantidade",
      amountPaid: "Informe o valor pago",
      date: "Selecione a data",
    });
  });

  it("aceita formulário preenchido sem erros", () => {
    expect(validateEntryForm(filled)).toEqual({});
  });

  it("valida quantidade e valor pago não positivos", () => {
    const errs = validateEntryForm({ ...filled, amount: "0", amountPaid: "-5" });
    expect(errs.amount).toBe("Informe a quantidade");
    expect(errs.amountPaid).toBe("Informe o valor pago");
  });

  it("exige mínimo de 2 parcelas e data de início na recorrência", () => {
    const errs = validateEntryForm({ ...filled, isRecurrent: true, recurrenceCount: 1 });
    expect(errs.recurrenceCount).toBe("Mínimo de 2 parcelas para gerar recorrência");
    expect(errs.startDate).toBe("Selecione a data de início");
  });

  it("recorrência válida (2+ parcelas e startDate) não gera erros extras", () => {
    const errs = validateEntryForm({
      ...filled,
      isRecurrent: true,
      recurrenceCount: 2,
      startDate: "2026-09-01",
    });
    expect(errs).toEqual({});
  });
});
