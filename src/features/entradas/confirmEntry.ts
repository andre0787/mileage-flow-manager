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

      // Confirmação de transferência pendente (aguardando + sourceAccountId):
      // a conta origem precisa ser debitada — addEntry pula contas para
      // aguardando, e sem isso os pontos sairiam da origem só no confirm.
      if (entry.sourceAccountId) {
        const { data: source, error: srcErr } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", entry.sourceAccountId)
          .maybeSingle();
        if (srcErr) return { error: toQueryError(srcErr) };
        if (source) {
          const srcBalance = Number(source.balance);
          const srcInvested = Number(source.total_invested ?? 0);
          const proportionalCost = calcProportionalCost(entry.amount, srcBalance, srcInvested);
          const srcUpdate = calcAccountUpdate(
            srcBalance,
            srcInvested,
            -entry.amount,
            -proportionalCost,
          );
          const { error: updSrcErr } = await supabase
            .from("accounts")
            .update(srcUpdate)
            .eq("id", entry.sourceAccountId);
          if (updSrcErr) return { error: toQueryError(updSrcErr) };
        }
      }

      return { data: null };
    },
  }),
});
