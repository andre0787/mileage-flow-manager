import { useAuth } from "@/features/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logError, logDestructiveOp } from "@/lib/logger";
import { addMonthsClamped } from "@/lib/dateUtils";
import type { PointEntry } from "@/types";

/** Converte um erro do Supabase para o formato esperado pelos hooks */
export function toQueryError(err: unknown) {
  return {
    message: err instanceof Error ? err.message : String(err),
    // Mantemos a estrutura esperada pelo toast e pelos testes
    // que esperam um objeto com propriedade `message`.
  };
}

export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

/** Gera N entradas futuras para recorrência */
export function generateRecurringEntries(
  entry: PointEntry,
  userId: string,
  intervalDays: number,
  endDate: string,
  recurrenceDayOfMonth?: number,
): Partial<PointEntry>[] {
  const future: Partial<PointEntry>[] = [];
  const end = new Date(endDate);
  const start = new Date(entry.date);
  const monthsMap: Record<number, number> = { 30: 1, 90: 3, 180: 6, 365: 12 };
  const months = monthsMap[intervalDays] ?? 1;
  let occurrence = 1;

  while (true) {
    const dateStr =
      recurrenceDayOfMonth !== undefined
        ? addMonthsClamped(entry.date, months * occurrence, recurrenceDayOfMonth)
        : new Date(start.getTime() + intervalDays * occurrence * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
    const cursor = new Date(dateStr);
    if (cursor > end) break;
    future.push({
      id: crypto.randomUUID(),
      accountId: entry.accountId,
      origemTypeId: entry.origemTypeId,
      amount: entry.amount,
      amountPaid: entry.amountPaid,
      costPerThousand: entry.costPerThousand,
      conversionRate: entry.conversionRate,
      milesGenerated: entry.milesGenerated,
      costPerMile: entry.costPerMile,
      sourceAccountId: entry.sourceAccountId,
      bonusPercent: entry.bonusPercent,
      cartAmount: entry.cartAmount,
      cartCost: entry.cartCost,
      date: dateStr,
      entryStatus: "aguardando",
      parentEntryId: entry.id,
      recurrenceInterval: intervalDays,
      recurrenceEnd: endDate,
      recurrenceDayOfMonth,
    });
    occurrence++;
  }
  return future;
}

export async function clearAccountDataFn(userId?: string | null) {
  // Phase 1: Child tables with FK dependencies on parent tables
  const childTables = ["sales", "entries"];
  const childResults = await Promise.all(
    childTables.map((table) => supabase.from(table).delete().not("id", "is", null)),
  );
  for (const { error } of childResults) {
    if (error) throw error;
  }

  // Phase 2: Independent parent tables
  const parentTables = ["accounts", "clients", "owners", "programs", "origem_types"];
  const parentResults = await Promise.all(
    parentTables.map((table) => supabase.from(table).delete().not("id", "is", null)),
  );
  for (const { error } of parentResults) {
    if (error) throw error;
  }

  // Re-insert built-in Transferência type (preserved across reset)
  if (userId) {
    const { error: insErr } = await supabase.from("origem_types").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      name: "Transferência",
      account_type: "milhas",
      color: "#8b5cf6",
    });
    if (insErr) console.error("[clearAccountData] failed to re-insert Transferência:", insErr);
  }
}

export function useClearAccountDataMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => clearAccountDataFn(user?.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ refetchType: "all" });
      logDestructiveOp("clear", "account_data");
      toast.success("Dados da conta limpos com sucesso");
    },
    onError: (err) => {
      logError("clearAccountData", err);
      toast.error("Erro ao limpar dados da conta");
    },
  });
}
