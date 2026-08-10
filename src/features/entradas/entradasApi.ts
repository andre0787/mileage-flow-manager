import { baseApi } from "@/features/api/baseApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { supabase } from "@/lib/supabase";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";
import { generateRecurringEntries } from "@/hooks/useDatabase/shared";
import { mapEntry } from "@/hooks/useDatabase/mappers";
import { parseDescription, serializeDescription } from "@/types";
import type { PointEntry } from "@/types";

// ponytail: corpo idêntico ao useDatabase/entries.ts (migrado sem mudança de
// comportamento); os toasts/logError vivem nos wrappers (hooks.ts) — aqui só
// acessa Supabase e devolve { data | error } para o RTK Query.

// RTK Query exige error no shape FetchBaseQueryError (serializável).
function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export const entradasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEntries: builder.query<PointEntry[], string>({
      providesTags: ["entries"],
      queryFn: async () => {
        const { data, error } = await supabase.from("entries").select("*");
        if (error) return { error: toQueryError(error) };
        return { data: (data ?? []).map(mapEntry) };
      },
    }),

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
          for (const fe of futureEntries) {
            await supabase.from("entries").insert({
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
            });
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

    updateEntry: builder.mutation<null, { oldEntry: PointEntry; updates: Partial<PointEntry> }>({
      invalidatesTags: ["entries", "accounts"],
      queryFn: async ({ oldEntry, updates }) => {
        const isAguardando = oldEntry.entryStatus === "aguardando";

        const { error: delErr } = await supabase.from("entries").delete().eq("id", oldEntry.id);
        if (delErr) return { error: toQueryError(delErr) };

        const merged: PointEntry = { ...oldEntry, ...updates };

        if (!isAguardando) {
          const newIsAguardando = merged.entryStatus === "aguardando";
          const oldMilesAdded = oldEntry.milesGenerated ?? oldEntry.amount;
          const newMilesAdded = merged.milesGenerated ?? merged.amount;

          // ─── Delta approach: net change for confirmed→confirmed
          //     Reverse old (confirmed→aguardando) or delta (confirmed→confirmed)
          const applyDelta = !newIsAguardando;
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

        // New dest: only apply if old was aguardando (no delta applied above)
        if (isAguardando) {
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

    deleteEntry: builder.mutation<null, PointEntry>({
      invalidatesTags: ["entries", "accounts"],
      queryFn: async (entry) => {
        if (entry.recurrenceInterval && entry.recurrenceEnd) {
          const { data: childEntries } = await supabase
            .from("entries")
            .select("id")
            .filter("description", "like", `%"parentEntryId":"${entry.id}"%`);
          if (childEntries) {
            for (const child of childEntries) {
              await supabase.from("entries").delete().eq("id", child.id);
            }
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
  }),
});
