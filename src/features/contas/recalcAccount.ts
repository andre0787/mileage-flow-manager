import { parseDescription } from "@/types";
import { supabase, toQueryError } from "./shared";
import type { ContasBuilder } from "./shared";

export const recalcAccountEndpoint = (builder: ContasBuilder) => ({
  recalcAccount: builder.mutation<null, string>({
    invalidatesTags: ["accounts", "entries", "sales"],
    queryFn: async (accountId) => {
      const { data: entries, error: entriesErr } = await supabase
        .from("entries")
        .select("miles_generated, amount, amount_paid, description")
        .eq("account_id", accountId);
      if (entriesErr) return { error: toQueryError(entriesErr) };

      const confirmedEntries = (entries ?? []).filter((entry) => {
        if (!entry.description) return true;
        return parseDescription(entry.description).entryStatus !== "aguardando";
      });
      const { data: sales, error: salesErr } = await supabase
        .from("sales")
        .select("miles_used")
        .eq("account_id", accountId)
        .neq("status", "cancelado");
      if (salesErr) return { error: toQueryError(salesErr) };

      const entriesSum = confirmedEntries.reduce(
        (sum, entry) => sum + Number(entry.miles_generated ?? entry.amount),
        0,
      );
      const salesSum = (sales ?? []).reduce((sum, sale) => sum + Number(sale.miles_used), 0);
      const newBalance = Math.max(0, entriesSum - salesSum);
      const investedSum = confirmedEntries.reduce(
        (sum, entry) => sum + Number(entry.amount_paid ?? 0),
        0,
      );
      const entryAvgCost = entriesSum > 0 ? investedSum / entriesSum : 0;
      const newInvested = Math.max(0, investedSum - entryAvgCost * salesSum);
      const newAvgCost = newBalance > 0 ? newInvested / newBalance : 0;
      const { error: updateErr } = await supabase
        .from("accounts")
        .update({
          balance: newBalance,
          total_invested: newInvested,
          average_cost_per_mile: newAvgCost,
        })
        .eq("id", accountId);
      if (updateErr) return { error: toQueryError(updateErr) };
      return { data: null };
    },
  }),
});
