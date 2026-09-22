import { useMemo } from "react";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import { countPassengersInCycle } from "@/lib/passengerCycle";
import type { Account, Owner, Program, Sale, SaleFormData } from "@/types";

export interface StockInfoItem {
  accountId: string;
  ownerId: string;
  ownerName: string;
  accountName: string;
  programId: string;
  program: string;
  availableMiles: number;
  averageCostPerMile: number;
}

export interface UseSaleFormStockProps {
  accounts: Account[];
  owners: Owner[];
  programs: Program[];
  sales: Sale[];
  form: SaleFormData;
  mode: "create" | "edit";
  editingSaleId?: string;
}

export function useSaleFormStock({
  accounts,
  owners,
  programs,
  sales,
  form,
  mode,
  editingSaleId,
}: UseSaleFormStockProps) {
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

  return {
    stockInfo,
    ownersList,
    selectedOwnerStock,
    selectedProgramStock,
    effectiveAvailableMiles,
    programConfig,
    usedPassengersInCycle,
    additionalCostsTotal,
    profitPreview,
  };
}
