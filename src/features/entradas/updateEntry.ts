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

        // ─── Delta approach: net change for confirmed→confirmed no MESMO destino.
        //     Se o destino mudou, delta não se aplica: reverter tudo na conta antiga
        //     e creditar o valor completo na conta nova (bloco "New dest" abaixo).
        //     Reverse old (confirmed→aguardando ou conta alterada) ou delta
        //     (confirmed→confirmed na mesma conta).
        const applyDelta = !newIsAguardando && !destChanged;
        const deltaMiles = applyDelta ? newMilesAdded - oldMilesAdded : -oldMilesAdded; // reverse all
        const deltaInvested = applyDelta
          ? merged.amountPaid - oldEntry.amountPaid
          : -oldEntry.amountPaid;

        if (deltaMiles !== 0 || deltaInvested !== 0) {
          const { data: dest } = await supabase
            .from("accounts")
            .select("balance, total_invested")
            .eq("id", oldEntry.accountId)
            .single();
          if (dest) {
            const update = calcAccountUpdate(
              Number(dest.balance),
              Number(dest.total_invested ?? 0),
              deltaMiles,
              deltaInvested,
            );
            await supabase.from("accounts").update(update).eq("id", oldEntry.accountId);
          }
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
            const update = calcAccountUpdate(
              Number(src.balance),
              Number(src.total_invested ?? 0),
              oldEntry.amount,
              oldProp,
            );
            await supabase.from("accounts").update(update).eq("id", oldEntry.sourceAccountId);
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
          const srcBalance = Number(srcRes.data.balance);
          const srcInvested = Number(srcRes.data.total_invested ?? 0);
          const proportionalCost = calcProportionalCost(merged.amount, srcBalance, srcInvested);
          const srcUpdate = calcAccountUpdate(
            srcBalance,
            srcInvested,
            -merged.amount,
            -proportionalCost,
          );
          await supabase.from("accounts").update(srcUpdate).eq("id", merged.sourceAccountId);
        }
      }

      // New dest: apply full when old was aguardando (no delta applied above)
      // OR when the destination account changed (old was fully reversed).
      // (aguardando já retornou acima — nova entrada pendente não toca saldos.)
      if (isAguardando || destChanged) {
        const destRes = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", merged.accountId)
          .single();
        if (destRes.data) {
          const amountToAdd = merged.milesGenerated ?? merged.amount;
          const destUpdate = calcAccountUpdate(
            Number(destRes.data.balance),
            Number(destRes.data.total_invested ?? 0),
            amountToAdd,
            merged.amountPaid,
          );
          await supabase.from("accounts").update(destUpdate).eq("id", merged.accountId);
        }
      }

      return { data: null };
    },
  }),
});
