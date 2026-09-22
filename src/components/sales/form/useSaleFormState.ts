import { useActionState, useState } from "react";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";
import type { Account, Owner, Program, Client, Sale, SaleFormData, SaleKind } from "@/types";
import {
  emptyForm,
  emptyPassenger,
  switchKind,
  handlePassengerClientChange,
} from "./salesFormUtils";
import { useSaleFormStock } from "./useSaleFormStock";

export { emptyForm, emptyPassenger };

interface UseSaleFormStateProps {
  accounts: Account[];
  owners: Owner[];
  programs: Program[];
  clients: Client[];
  sales: Sale[];
  onSubmit: (data: SaleFormData) => void;
  mode?: "create" | "edit";
  initialData?: SaleFormData;
  editingSaleId?: string;
}

export function useSaleFormState({
  accounts,
  owners,
  programs,
  clients,
  sales,
  onSubmit,
  mode = "create",
  initialData,
  editingSaleId,
}: UseSaleFormStateProps) {
  const [form, setForm] = useState<SaleFormData>(() => {
    const base = { ...emptyForm, ...initialData };
    if (!base.additionalCosts || base.additionalCosts.length === 0) {
      base.additionalCosts =
        base.additionalCost || base.additionalCostDesc
          ? [{ amount: base.additionalCost, desc: base.additionalCostDesc }]
          : [{ desc: "", amount: "" }];
    }
    return base;
  });
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const {
    ownersList,
    selectedOwnerStock,
    selectedProgramStock,
    effectiveAvailableMiles,
    programConfig,
    usedPassengersInCycle,
    additionalCostsTotal,
    profitPreview,
  } = useSaleFormStock({ accounts, owners, programs, sales, form, mode, editingSaleId });

  const update = (partial: Partial<SaleFormData>) => setForm((prev) => ({ ...prev, ...partial }));

  const onSwitchKind = (kind: SaleKind) => switchKind({ kind, update });

  const onPassengerClientChange = (index: number, selectedClientId: string) =>
    handlePassengerClientChange({
      index,
      selectedClientId,
      clients,
      passengers: form.passengers,
      update,
    });

  const [, formAction] = useActionState(
    async () => {
      const costs = (form.additionalCosts ?? []).filter(
        (c) => (c.desc.trim() || c.amount.trim()) && parseFloat(c.amount) > 0,
      );
      const total = costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
      onSubmit({
        ...form,
        observations: (form.observations ?? "").trim(),
        additionalCosts: form.kind === "servico" ? [] : costs,
        additionalCost: total ? total.toFixed(2) : "",
        additionalCostDesc: costs[0]?.desc ?? "",
        costPerMile: selectedProgramStock?.averageCostPerMile ?? 0,
      });
      setForm({ ...emptyForm, date: todayISODate() });
      return { ok: true };
    },
    { ok: false },
  );

  const hasValidDate = isValidISODate(form.date);
  const canSubmitServico =
    form.clientId && form.serviceType && parseFloat(form.saleValue) > 0 && hasValidDate;
  const canSubmitMiles =
    form.ownerName &&
    form.accountId &&
    form.program &&
    form.clientId &&
    form.milesUsed &&
    form.saleValue &&
    hasValidDate &&
    (!selectedProgramStock || parseFloat(form.milesUsed) <= effectiveAvailableMiles);
  const canSubmit = form.kind === "servico" ? canSubmitServico : canSubmitMiles;

  const newPassengersCount = form.passengers.filter((p) => p.name.trim()).length;
  const totalPassengersInCycle = usedPassengersInCycle + newPassengersCount;
  const maxPassengersAllowed = programConfig?.maxPassengers;
  const passengerLimitExceeded =
    Boolean(maxPassengersAllowed) && totalPassengersInCycle > maxPassengersAllowed!;

  return {
    form,
    setForm,
    update,
    switchKind: onSwitchKind,
    isClientDialogOpen,
    setIsClientDialogOpen,
    ownersList,
    selectedOwnerStock,
    selectedProgramStock,
    effectiveAvailableMiles,
    additionalCostsTotal,
    profitPreview,
    handlePassengerClientChange: onPassengerClientChange,
    formAction,
    canSubmit,
    usedPassengersInCycle,
    newPassengersCount,
    totalPassengersInCycle,
    maxPassengersAllowed,
    passengerLimitExceeded,
  };
}
