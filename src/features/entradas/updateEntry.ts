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

/** Busca saldo da conta e aplica delta de milhas/investido (helper rule-41). */
async function applyBalance(accountId: string, deltaMiles: number, deltaInvested: number) {
  const { data } = await supabase
    .from("accounts")
    .select("balance, total_invested")
    .eq("id", accountId)
    .single();
  if (!data) return;
  const update = calcAccountUpdate(
    Number(data.balance),
    Number(data.total_invested ?? 0),
    deltaMiles,
    deltaInvested,
  );
  await supabase.from("accounts").update(update).eq("id", accountId);
}

export const updateEntryEndpoint = (builder: EntradasBuilder) => ({
  updateEntry: builder.mutation<null, { oldEntry: PointEntry; updates: Partial<PointEntry> }>({
    invalidatesTags: ["entries", "accounts"],
    queryFn: async ({ oldEntry, updates }) => {
      const isAguardando = oldEntry.entryStatus === "aguardando";

      const { error: delErr } = await supabase.from("entries").delete().eq("id", oldEntry.id);
      if (delErr) return { error: toQueryError(delErr) };

      const merged: PointEntry = { ...oldEntry, ...updates };
      const destChanged = oldEntry.accountId !== merged.accountId;

      if (!isAguardando) {
        const newIsAguardando = merged.entryStatus === "aguardando";
        const oldMilesAdded = oldEntry.milesGenerated ?? oldEntry.amount;
        const newMilesAdded = merged.milesGenerated ?? merged.amount;

        // Delta (confirmed→confirmed mesmo destino) ou reversão total
        // (confirmed→aguardando ou destino alterado — bloco "New dest" credita).
        const applyDelta = !newIsAguardando && !destChanged;
        const deltaMiles = applyDelta ? newMilesAdded - oldMilesAdded : -oldMilesAdded;
        const deltaInvested = applyDelta
          ? merged.amountPaid - oldEntry.amountPaid
          : -oldEntry.amountPaid;

        if (deltaMiles !== 0 || deltaInvested !== 0) {
          await applyBalance(oldEntry.accountId, deltaMiles, deltaInvested);
        }

        // Old source: reverse (add back points) — always if there was one
        if (oldEntry.sourceAccountId) {
          const { data: src } = await supabase
            .from("accounts")
            .select("balance, total_invested")
            .eq("id", oldEntry.sourceAccountId)
            .single();
          if (src) {
            const oldProp = calcProportionalCost(
              oldEntry.amount,
              Number(src.balance),
              Number(src.total_invested ?? 0),
            );
            await applyBalance(oldEntry.sourceAccountId, oldEntry.amount, oldProp);
          }
        }
      }

      const { data: authData } = await supabase.auth.getUser();
      const { error: insErr } = await supabase.from("entries").insert({
        id: merged.id,
        user_id: authData.user!.id,
        account_id: merged.accountId,
        origem_type_id: merged.origemTypeId,
        amount: merged.amount,
        amount_paid: merged.amountPaid,
        cost_per_thousand: merged.costPerThousand,
        conversion_rate: merged.conversionRate,
        miles_generated: merged.milesGenerated,
        cost_per_mile: merged.costPerMile,
        source_account_id: merged.sourceAccountId,
        bonus_percent: merged.bonusPercent,
        description:
          serializeDescription({
            cartAmount: merged.cartAmount,
            cartCost: merged.cartCost,
            entryStatus: merged.entryStatus,
            parentEntryId: merged.parentEntryId,
            recurrenceInterval: merged.recurrenceInterval,
            recurrenceEnd: merged.recurrenceEnd,
            recurrenceDayOfMonth: merged.recurrenceDayOfMonth,
          }) ?? null,
        date: merged.date,
      });
      if (insErr) return { error: toQueryError(insErr) };

      if (merged.entryStatus === "aguardando") return { data: null };
      // New source: deduct points
      if (merged.sourceAccountId) {
        const srcRes = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", merged.sourceAccountId)
          .single();
        if (srcRes.data) {
          const proportionalCost = calcProportionalCost(
            merged.amount,
            Number(srcRes.data.balance),
            Number(srcRes.data.total_invested ?? 0),
          );
          await applyBalance(
            merged.sourceAccountId,
            -merged.amount,
            -proportionalCost,
          );
        }
      }

      // New dest: apply full when old was aguardando (no delta applied above)
      // OR when the destination account changed (old was fully reversed).
      if (isAguardando || destChanged) {
        await applyBalance(
          merged.accountId,
          merged.milesGenerated ?? merged.amount,
          merged.amountPaid,
        );
      }

      return { data: null };
    },
  }),
});
