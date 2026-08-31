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

export const addEntryEndpoint = (builder: EntradasBuilder) => ({
  addEntry: builder.mutation<null, PointEntry>({
    invalidatesTags: ["entries", "accounts"],
    queryFn: async (entry) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const isAguardando = entry.entryStatus === "aguardando";

      const { error } = await supabase.from("entries").insert({
        id: entry.id,
        user_id: user.id,
        account_id: entry.accountId,
        origem_type_id: entry.origemTypeId,
        amount: entry.amount,
        amount_paid: entry.amountPaid,
        cost_per_thousand: entry.costPerThousand,
        conversion_rate: entry.conversionRate,
        miles_generated: entry.milesGenerated,
        cost_per_mile: entry.costPerMile,
        source_account_id: entry.sourceAccountId,
        bonus_percent: entry.bonusPercent,
        description:
          serializeDescription({
            cartAmount: entry.cartAmount,
            cartCost: entry.cartCost,
            entryStatus: entry.entryStatus,
            parentEntryId: entry.parentEntryId,
            recurrenceInterval: entry.recurrenceInterval,
            recurrenceEnd: entry.recurrenceEnd,
            recurrenceValueMode: entry.recurrenceValueMode,
            recurrenceDayOfMonth: entry.recurrenceDayOfMonth,
          }) ?? null,
        date: entry.date,
      });
      if (error) return { error: toQueryError(error) };

      if (!isAguardando && entry.recurrenceInterval && entry.recurrenceEnd) {
        const futureEntries = generateRecurringEntries(
          entry,
          user.id,
          entry.recurrenceInterval,
          entry.recurrenceEnd,
          entry.recurrenceDayOfMonth,
        );
        if (futureEntries.length > 0) {
          const bulkInsertPayload = futureEntries.map((fe) => ({
            id: fe.id!,
            user_id: user.id,
            account_id: fe.accountId!,
            origem_type_id: fe.origemTypeId!,
            amount: fe.amount!,
            amount_paid: fe.amountPaid!,
            cost_per_thousand: fe.costPerThousand!,
            conversion_rate: fe.conversionRate ?? null,
            miles_generated: fe.milesGenerated ?? null,
            cost_per_mile: fe.costPerMile ?? null,
            source_account_id: fe.sourceAccountId ?? null,
            bonus_percent: fe.bonusPercent ?? null,
            description:
              serializeDescription({
                cartAmount: fe.cartAmount,
                cartCost: fe.cartCost,
                entryStatus: fe.entryStatus,
                parentEntryId: fe.parentEntryId,
                recurrenceInterval: fe.recurrenceInterval,
                recurrenceEnd: fe.recurrenceEnd,
                recurrenceDayOfMonth: fe.recurrenceDayOfMonth,
                recurrenceValueMode: entry.recurrenceValueMode,
              }) ?? null,
            date: fe.date!,
          }));
          const { error: bulkError } = await supabase.from("entries").insert(bulkInsertPayload);
          if (bulkError) return { error: toQueryError(bulkError) };
        }
      }

      if (isAguardando) return { data: null };

      if (entry.sourceAccountId) {
        const { data: source } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", entry.sourceAccountId)
          .single();
        if (source) {
          const srcBalance = Number(source.balance);
          const srcInvested = Number(source.total_invested ?? 0);
          const proportionalCost = calcProportionalCost(entry.amount, srcBalance, srcInvested);
          const update = calcAccountUpdate(
            srcBalance,
            srcInvested,
            -entry.amount,
            -proportionalCost,
          );
          await supabase.from("accounts").update(update).eq("id", entry.sourceAccountId);
        }
      }

      const { data: dest } = await supabase
        .from("accounts")
        .select("balance, total_invested")
        .eq("id", entry.accountId)
        .single();
      if (dest) {
        const amountToAdd = entry.milesGenerated ?? entry.amount;
        const update = calcAccountUpdate(
          Number(dest.balance),
          Number(dest.total_invested ?? 0),
          amountToAdd,
          entry.amountPaid,
        );
        await supabase.from("accounts").update(update).eq("id", entry.accountId);
      }

      return { data: null };
    },
  }),
});
