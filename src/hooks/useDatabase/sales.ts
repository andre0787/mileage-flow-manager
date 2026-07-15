import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import { logError, logDestructiveOp } from "@/lib/logger";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";
import type { Sale } from "@/types";
import { useUserId } from "./shared";
import { mapSale } from "./mappers";

type SaleUpdate = Database["public"]["Tables"]["sales"]["Update"];

export function useSalesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["sales", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*");
      if (error) throw error;
      return (data ?? []).map(mapSale);
    },
    enabled: !!userId,
  });
}

export function useAddSaleMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sale: Sale) => {
      const { error } = await supabase.from("sales").insert({
        id: sale.id,
        user_id: user!.id,
        account_id: sale.accountId,
        account_name: sale.accountName,
        owner_name: sale.ownerName,
        program: sale.program,
        client_id: sale.clientId,
        client_name: sale.clientName,
        miles_used: sale.milesUsed,
        sale_value: sale.saleValue,
        price_per_mile: sale.pricePerMile,
        cost_per_mile: sale.costPerMile,
        additional_cost: sale.additionalCost,
        additional_cost_desc: sale.additionalCostDesc,
        profit: sale.profit,
        profit_margin: sale.profitMargin,
        status: sale.status,
        ticket_locator: sale.ticketLocator,
        passengers: sale.passengers,
        date: sale.date,
      });
      if (error) throw error;

      if (sale.accountId) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", sale.accountId)
          .single();
        if (acc) {
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);
          const proportionalInvested =
            currentAvgCost > 0
              ? currentAvgCost * sale.milesUsed
              : calcProportionalCost(sale.milesUsed, currentBalance, currentInvested);
          const update = calcAccountUpdate(
            currentBalance,
            currentInvested,
            -sale.milesUsed,
            -proportionalInvested,
          );
          await supabase.from("accounts").update(update).eq("id", sale.accountId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
    },
    onError: (err) => {
      logError("addSale", err);
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao criar venda");
    },
  });
}

export function useUpdateSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Sale> & { id: string }) => {
      // 1. Fetch current sale from DB for old values
      const { data: oldSale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !oldSale) throw fetchError ?? new Error("Venda não encontrada");

      // 2. Build update data
      const updateData: SaleUpdate = {};
      if (data.accountId !== undefined) updateData.account_id = data.accountId;
      if (data.accountName !== undefined) updateData.account_name = data.accountName;
      if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
      if (data.program !== undefined) updateData.program = data.program;
      if (data.clientId !== undefined) updateData.client_id = data.clientId;
      if (data.clientName !== undefined) updateData.client_name = data.clientName;
      if (data.milesUsed !== undefined) updateData.miles_used = data.milesUsed;
      if (data.saleValue !== undefined) updateData.sale_value = data.saleValue;
      if (data.pricePerMile !== undefined) updateData.price_per_mile = data.pricePerMile;
      if (data.costPerMile !== undefined) updateData.cost_per_mile = data.costPerMile;
      if (data.additionalCost !== undefined) updateData.additional_cost = data.additionalCost;
      if (data.additionalCostDesc !== undefined)
        updateData.additional_cost_desc = data.additionalCostDesc;
      if (data.profit !== undefined) updateData.profit = data.profit;
      if (data.profitMargin !== undefined) updateData.profit_margin = data.profitMargin;
      if (data.status !== undefined) updateData.status = data.status as SaleUpdate["status"];
      if (data.ticketLocator !== undefined) updateData.ticket_locator = data.ticketLocator;
      if (data.passengers !== undefined) updateData.passengers = data.passengers;
      if (data.date !== undefined) updateData.date = data.date;

      // 3. Compute old vs new
      const oldMiles = Number(oldSale.miles_used);
      const newMiles = data.milesUsed ?? oldMiles;
      const oldAccountId = oldSale.account_id;
      const newAccountId = data.accountId ?? oldAccountId;
      const oldWasCanceled = oldSale.status === "cancelado";
      const newIsCanceled = (data.status ?? oldSale.status) === "cancelado";

      // 4. Reverse old impact on account (add back miles + cost)
      //    Skip if old sale was canceled (already reversed)
      if (oldAccountId && oldMiles > 0 && !oldWasCanceled) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", oldAccountId)
          .single();
        if (acc) {
          const avgCost = Number(acc.average_cost_per_mile ?? 0);
          const costToRestore = avgCost > 0
            ? avgCost * oldMiles
            : Number(oldSale.cost_per_mile) * oldMiles;
          const update = calcAccountUpdate(
            Number(acc.balance), Number(acc.total_invested ?? 0),
            oldMiles, costToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", oldAccountId);
        }
      }

      // 5. Update sale record
      const { error } = await supabase.from("sales").update(updateData).eq("id", id);
      if (error) throw error;

      // 6. Apply new impact on account (deduct miles + cost)
      if (newAccountId && newMiles > 0 && !newIsCanceled) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", newAccountId)
          .single();
        if (acc) {
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);
          const proportionalInvested =
            currentAvgCost > 0
              ? currentAvgCost * newMiles
              : calcProportionalCost(newMiles, currentBalance, currentInvested);
          const update = calcAccountUpdate(
            currentBalance, currentInvested,
            -newMiles, -proportionalInvested,
          );
          await supabase.from("accounts").update(update).eq("id", newAccountId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
    },
    onError: (err) => {
      logError("updateSale", err);
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao atualizar venda");
    },
  });
}

export function useCancelSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !sale) throw fetchError ?? new Error("Venda não encontrada");

      const { error: updateError } = await supabase
        .from("sales")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (updateError) throw updateError;

      if (sale.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", sale.account_id)
          .single();
        if (acc) {
          const miles = Number(sale.miles_used);
          const costToRestore = miles * Number(sale.cost_per_mile);
          const update = calcAccountUpdate(
            Number(acc.balance),
            Number(acc.total_invested ?? 0),
            miles,
            costToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      logDestructiveOp("cancel", "sale");
    },
    onError: (err) => {
      logError("cancelSale", err);
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao cancelar venda");
    },
  });
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;

      if (sale.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", sale.account_id)
          .single();
        if (acc) {
          const milesToRestore = Number(sale.miles_used);
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);

          const investedToRestore =
            currentAvgCost > 0 && currentBalance > 0
              ? calcProportionalCost(milesToRestore, currentBalance, currentInvested)
              : Number(sale.cost_per_mile) * milesToRestore;

          const update = calcAccountUpdate(
            currentBalance,
            currentInvested,
            milesToRestore,
            investedToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      logDestructiveOp("delete", "sale");
      toast.success("Venda excluída com sucesso");
    },
    onError: (err) => {
      logError("deleteSale", err);
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      toast.error("Erro ao excluir venda");
    },
  });
}
