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

export const confirmEntryEndpoint = (builder: EntradasBuilder) => ({
  confirmEntry: builder.mutation<null, PointEntry>({
    invalidatesTags: ["entries", "accounts"],
    queryFn: async (entry) => {
      const currentDesc = parseDescription(entry.description);
      const newDesc = serializeDescription({
        cartAmount: currentDesc.cartAmount,
        cartCost: currentDesc.cartCost,
        parentEntryId: currentDesc.parentEntryId,
        recurrenceInterval: currentDesc.recurrenceInterval,
        recurrenceEnd: currentDesc.recurrenceEnd,
      });
      const { error: updErr } = await supabase
        .from("entries")
        .update({ description: newDesc ?? null })
        .eq("id", entry.id);
      if (updErr) return { error: toQueryError(updErr) };

      const { data: dest, error: accErr } = await supabase
        .from("accounts")
        .select("balance, total_invested")
        .eq("id", entry.accountId)
        .maybeSingle();
      if (accErr) return { error: toQueryError(accErr) };
      if (dest) {
        const amountToAdd = entry.milesGenerated ?? entry.amount;
        const update = calcAccountUpdate(
          Number(dest.balance),
          Number(dest.total_invested ?? 0),
          amountToAdd,
          entry.amountPaid,
        );
        const { error: updAccErr } = await supabase
          .from("accounts")
          .update(update)
          .eq("id", entry.accountId);
        if (updAccErr) return { error: toQueryError(updAccErr) };
      }

      return { data: null };
    },
  }),
});
