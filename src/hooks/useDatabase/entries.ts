import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";
import { logError, logDestructiveOp } from "@/lib/logger";
import type { PointEntry } from "@/types";
import { parseDescription, serializeDescription } from "@/types";
import { useUserId, generateRecurringEntries } from "./shared";
import { mapEntry } from "./mappers";

export function useEntriesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["entries", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select("*");
      if (error) throw error;
      return (data ?? []).map(mapEntry);
    },
    enabled: !!userId,
  });
}

export function useAddEntryMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: PointEntry) => {
      const isAguardando = entry.entryStatus === "aguardando";

      const { error } = await supabase.from("entries").insert({
        id: entry.id,
        user_id: user!.id,
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
          }) ?? null,
        date: entry.date,
      });
      if (error) throw error;

      if (!isAguardando && entry.recurrenceInterval && entry.recurrenceEnd) {
        const futureEntries = generateRecurringEntries(
          entry,
          user!.id,
          entry.recurrenceInterval,
          entry.recurrenceEnd,
        );
        for (const fe of futureEntries) {
          await supabase.from("entries").insert({
            id: fe.id!,
            user_id: user!.id,
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
                recurrenceValueMode: entry.recurrenceValueMode,
              }) ?? null,
            date: fe.date!,
          });
        }
      }

      if (isAguardando) return;

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
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
      ]);
    },
    onError: (err) => {
      logError("addEntry", err);
      // ponytail: mesmo com erro parcial (ex: saldo da conta), invalida cache pra entrada aparecer
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      toast.error("Erro ao salvar entrada");
    },
  });
}

export function useConfirmEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: PointEntry) => {
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
      if (updErr) throw updErr;

      const { data: dest, error: accErr } = await supabase
        .from("accounts")
        .select("balance, total_invested")
        .eq("id", entry.accountId)
        .maybeSingle();
      if (accErr) throw accErr;
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
        if (updAccErr) throw updAccErr;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
      ]);
    },
    onError: (err) => {
      console.error("[confirmEntry]", err);
      logError("confirmEntry", err);
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      toast.error("Erro ao confirmar entrada");
    },
  });
}

export function useUpdateEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      oldEntry,
      updates,
    }: {
      oldEntry: PointEntry;
      updates: Partial<PointEntry>;
    }) => {
      const isAguardando = oldEntry.entryStatus === "aguardando";

      const { error: delErr } = await supabase.from("entries").delete().eq("id", oldEntry.id);
      if (delErr) throw delErr;

      const merged: PointEntry = { ...oldEntry, ...updates };

      if (!isAguardando) {
        const newIsAguardando = merged.entryStatus === "aguardando";
        const oldMilesAdded = oldEntry.milesGenerated ?? oldEntry.amount;
        const newMilesAdded = merged.milesGenerated ?? merged.amount;

        // ─── Delta approach: net change for confirmed→confirmed
        //     Reverse old (confirmed→aguardando) or delta (confirmed→confirmed)
        const applyDelta = !newIsAguardando;
        const deltaMiles = applyDelta
          ? newMilesAdded - oldMilesAdded
          : -oldMilesAdded; // reverse all
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
            const oldProp = calcProportionalCost(oldEntry.amount, Number(src.balance), Number(src.total_invested ?? 0));
            const update = calcAccountUpdate(
              Number(src.balance), Number(src.total_invested ?? 0),
              oldEntry.amount, oldProp,
            );
            await supabase.from("accounts").update(update).eq("id", oldEntry.sourceAccountId);
          }
        }
      }

      const { error: insErr } = await supabase.from("entries").insert({
        id: merged.id,
        user_id: (await supabase.auth.getUser()).data.user!.id,
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
          }) ?? null,
        date: merged.date,
      });
      if (insErr) throw insErr;

      if (merged.entryStatus === "aguardando") return;

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
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
      ]);
    },
    onError: (err) => {
      logError("updateEntry", err);
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao atualizar entrada");
    },
  });
}

export function useDeleteEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: PointEntry) => {
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
      if (error) throw error;

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
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
      ]);
      toast.success("Entrada excluída com sucesso");
    },
    onError: (err) => {
      logError("deleteEntry", err);
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao excluir entrada");
    },
  });
}
