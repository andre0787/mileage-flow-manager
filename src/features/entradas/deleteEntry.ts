import {
  supabase,
  calcProportionalCost,
  calcAccountUpdate,
  generateRecurringEntries,
  mapEntry,
  parseDescription,
  serializeDescription,
  toQueryError,
} from "./shared";
import type { PointEntry, EntradasBuilder } from "./shared";

export const deleteEntryEndpoint = (builder: EntradasBuilder) => ({
  deleteEntry: builder.mutation<null, PointEntry>({
    invalidatesTags: ["entries", "accounts"],
    queryFn: async (entry) => {
      if (entry.recurrenceInterval && entry.recurrenceEnd) {
        const { data: childEntries } = await supabase
          .from("entries")
          .select("id")
          .filter("description", "like", `%"parentEntryId":"${entry.id}"%`);
        if (childEntries && childEntries.length > 0) {
          const childIds = childEntries.map((child) => child.id);
          await supabase.from("entries").delete().in("id", childIds);
        }
      }

      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) return { error: toQueryError(error) };

      if (entry.entryStatus !== "aguardando") {
        const { data: dest } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", entry.accountId)
          .single();
        if (dest) {
          const amountToRemove = entry.milesGenerated ?? entry.amount;
          const update = calcAccountUpdate(
            Number(dest.balance),
            Number(dest.total_invested ?? 0),
            -amountToRemove,
            -entry.amountPaid,
          );
          await supabase.from("accounts").update(update).eq("id", entry.accountId);
        }

        if (entry.sourceAccountId) {
          const { data: source } = await supabase
            .from("accounts")
            .select("balance, total_invested")
            .eq("id", entry.sourceAccountId)
            .single();
          if (source) {
            // Restore source: points + proportional cost (not full amountPaid)
            const srcBalance = Number(source.balance);
            const srcInvested = Number(source.total_invested ?? 0);
            const proportionalCost = calcProportionalCost(entry.amount, srcBalance, srcInvested);
            const update = calcAccountUpdate(
              srcBalance,
              srcInvested,
              entry.amount,
              proportionalCost,
            );
            await supabase.from("accounts").update(update).eq("id", entry.sourceAccountId);
          }
        }
      }

      return { data: null };
    },
  }),
});
