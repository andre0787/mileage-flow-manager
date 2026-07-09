import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PointEntry } from "@/types";

export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

/** Gera N entradas futuras para recorrência de clube */
export function generateRecurringEntries(
  entry: PointEntry,
  userId: string,
  intervalDays: number,
  endDate: string,
): Partial<PointEntry>[] {
  const future: Partial<PointEntry>[] = [];
  const startDate = new Date(entry.date);
  const end = new Date(endDate);
  let cursor = new Date(startDate);
  while (cursor < end) {
    cursor = new Date(cursor.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    if (cursor > end) break;
    const dateStr = cursor.toISOString().split("T")[0];
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
    });
  }
  return future;
}

export function useClearAccountDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const tables = [
        "sales",
        "entries",
        "accounts",
        "clients",
        "owners",
        "programs",
        "origem_types",
      ];
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().not("id", "is", null);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
