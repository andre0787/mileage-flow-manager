import { useActionState, useMemo, useState } from "react";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import { countPassengersInCycle } from "@/lib/passengerCycle";
import type { Account, Owner, Program, Client, Sale, SaleFormData, SaleKind } from "@/types";

export const emptyPassenger = () => ({
  name: "",
  passengerId: crypto.randomUUID(),
  cpf: "",
  clientId: undefined as string | undefined,
});

export const emptyForm: SaleFormData = {
  ownerName: "",
  accountId: "",
  accountName: "",
  program: "",
  clientId: "",
  clientName: "",
  milesUsed: "",
  pricePerMile: "",
  saleValue: "",
  additionalCost: "",
  additionalCostDesc: "",
  additionalCosts: [{ desc: "", amount: "" }],
  kind: "milhas",
  serviceType: "",
  observations: "",
  date: todayISODate(),
  ticketLocator: "",
  passengers: [emptyPassenger()],
};

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

  const stockInfo = useMemo(() => {
    const ownersMap = new Map(owners.map((o) => [o.id, o.name]));
    const programsMap = new Map(programs.map((p) => [p.id, p.name]));
    return accounts
      .filter((a) => a.type === "milhas" && a.status === "ativa")
      .map((a) => ({
        accountId: a.id,
        ownerId: a.ownerId,
        ownerName: ownersMap.get(a.ownerId) ?? "",
        accountName: a.name,
        programId: a.programId,
        program: programsMap.get(a.programId) ?? "",
        availableMiles: a.balance,
        averageCostPerMile: a.averageCostPerMile ?? 0,
      }));
  }, [accounts, owners, programs]);

  const ownersList = useMemo(() => [...new Set(stockInfo.map((s) => s.ownerName))], [stockInfo]);
  const selectedOwnerStock = useMemo(
    () => stockInfo.filter((s) => s.ownerName === form.ownerName),
    [stockInfo, form.ownerName],
  );
  const selectedProgramStock = useMemo(
    () => stockInfo.find((s) => s.accountId === form.accountId),
    [stockInfo, form.accountId],
  );

  const editingOriginalSale = useMemo(
    () =>
      mode === "edit" && editingSaleId ? sales.find((s) => s.id === editingSaleId) : undefined,
    [mode, editingSaleId, sales],
  );

  const effectiveAvailableMiles = useMemo(() => {
    const base = selectedProgramStock?.availableMiles ?? 0;
    if (
      mode === "edit" &&
      editingOriginalSale &&
      editingOriginalSale.status !== "cancelado" &&
      form.accountId &&
      form.accountId === editingOriginalSale.accountId
    ) {
      return base + editingOriginalSale.milesUsed;
    }
    return base;
  }, [mode, editingOriginalSale, form.accountId, selectedProgramStock]);

  const programConfig = useMemo(
    () => programs.find((p) => p.id === selectedProgramStock?.programId),
    [programs, selectedProgramStock],
  );

  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
    return countPassengersInCycle(sales, {
      program: form.program,
      ownerName: form.ownerName,
      editingSaleId,
      cycleType: programConfig.passengerCycleType,
      cycleDays: programConfig.passengerCycleDays,
    });
  }, [sales, form.program, form.ownerName, programConfig, editingSaleId]);

  const additionalCostsTotal = useMemo(() => {
    if (form.additionalCosts && form.additionalCosts.length > 0) {
      const sum = form.additionalCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
      if (sum > 0) return sum;
    }
    return parseFloat(form.additionalCost || "0") || 0;
  }, [form.additionalCosts, form.additionalCost]);

  const profitPreview = useMemo(() => {
    if (form.kind === "servico") {
      const val = parseFloat(form.saleValue);
      if (!val || val <= 0) return null;
      return { costTotal: 0, profit: val, margin: 100 };
    }
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null;
    const miles = parseFloat(form.milesUsed);
    const val = parseFloat(form.saleValue);
    const addCost = additionalCostsTotal;
    const costPM = selectedProgramStock.averageCostPerMile;
    const profit = calcProfit(val, miles, costPM, addCost);
    return { costTotal: miles * costPM, profit, margin: calcProfitMargin(profit, val) };
  }, [form.kind, form.milesUsed, form.saleValue, additionalCostsTotal, selectedProgramStock]);

  const update = (partial: Partial<SaleFormData>) => setForm((prev) => ({ ...prev, ...partial }));

  const switchKind = (kind: SaleKind) => {
    if (kind === "servico") {
      update({
        kind,
        ownerName: "",
        accountId: "",
        accountName: "",
        program: "",
        milesUsed: "",
        pricePerMile: "",
        additionalCost: "",
        additionalCostDesc: "",
        additionalCosts: [],
        ticketLocator: "",
        passengers: [],
      });
    } else {
      update({ kind, serviceType: "", observations: "" });
    }
  };

  const handlePassengerClientChange = (index: number, selectedClientId: string) => {
    if (selectedClientId === "__manual__") {
      const upd = form.passengers.map((p, j) =>
        j === index ? { ...p, clientId: undefined, name: "", cpf: "" } : p,
      );
      update({ passengers: upd });
      return;
    }

    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    const upd = form.passengers.map((p, j) =>
      j === index
        ? {
            ...p,
            clientId: client.id,
            name: client.name,
            cpf: client.cpf ?? p.cpf,
          }
        : p,
    );
    update({ passengers: upd });
  };

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
    switchKind,
    isClientDialogOpen,
    setIsClientDialogOpen,
    ownersList,
    selectedOwnerStock,
    selectedProgramStock,
    effectiveAvailableMiles,
    additionalCostsTotal,
    profitPreview,
    handlePassengerClientChange,
    formAction,
    canSubmit,
    usedPassengersInCycle,
    newPassengersCount,
    totalPassengersInCycle,
    maxPassengersAllowed,
    passengerLimitExceeded,
  };
}
