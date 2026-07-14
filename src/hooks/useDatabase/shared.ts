import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { logError, logDestructiveOp } from "@/lib/logger";
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
  const { user } = useAuth();
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

      // Re-insert built-in Transferência type (preserved across reset)
      if (user) {
        const { error: insErr } = await supabase.from("origem_types").insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: "Transferência",
          account_type: "milhas",
          color: "#8b5cf6",
        });
        if (insErr) console.error("[clearAccountData] failed to re-insert Transferência:", insErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ refetchType: 'all' });
      logDestructiveOp("clear", "account_data");
      toast.success("Dados da conta limpos com sucesso");
    },
    onError: (err) => {
      logError("clearAccountData", err);
      toast.error("Erro ao limpar dados da conta");
    },
  });
}
