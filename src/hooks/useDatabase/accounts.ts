import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import { logError, logDestructiveOp } from "@/lib/logger";
import type { Account } from "@/types";
import { useUserId } from "./shared";
import { mapAccount } from "./mappers";

type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];

export function useAccountsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["accounts", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return (data ?? []).map(mapAccount);
    },
    enabled: !!userId,
  });
}

export function useAddAccountMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (account: Account) => {
      const { error } = await supabase.from("accounts").insert({
        id: account.id,
        user_id: user!.id,
        owner_id: account.ownerId,
        program_id: account.programId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        average_cost_per_mile: account.averageCostPerMile,
        total_invested: account.totalInvested,
        status: account.status,
        created_at: account.createdAt,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
    onError: (err) => {
      logError("addAccount", err);
      toast.error("Erro ao criar conta");
    },
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: string }) => {
      const updateData: AccountUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
      if (data.programId !== undefined) updateData.program_id = data.programId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.balance !== undefined) updateData.balance = data.balance;
      if (data.averageCostPerMile !== undefined)
        updateData.average_cost_per_mile = data.averageCostPerMile;
      if (data.totalInvested !== undefined) updateData.total_invested = data.totalInvested;
      if (data.status !== undefined) updateData.status = data.status;
      const { error } = await supabase.from("accounts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' }),
    onError: (err) => {
      logError("updateAccount", err);
      toast.error("Erro ao atualizar conta");
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      logDestructiveOp("delete", "account");
      toast.success("Conta excluída com sucesso");
    },
    onError: (err) => {
      logError("deleteAccount", err);
      toast.error("Erro ao excluir conta");
    },
  });
}

/**
 * Recalcula o saldo de uma conta a partir das entradas e vendas (fonte da verdade).
 * Corrige discrepâncias causadas por mutações antigas que não ajustavam o saldo.
 */
export function useRecalcAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      // Busca entradas da conta
      const { data: entries, error: entriesErr } = await supabase
        .from("entries")
        .select("miles_generated, amount, amount_paid, description")
        .eq("account_id", accountId);
      if (entriesErr) throw entriesErr;

      // Filtra confirmadas (entryStatus está no description JSON)
      // ponytail: parse inline em vez de importar de types/
      const confirmedEntries = (entries ?? []).filter(e => {
        if (!e.description) return true;
        try {
          const desc = JSON.parse(e.description);
          return desc.entryStatus !== "aguardando";
        } catch { return true; }
      });

      // Busca vendas não canceladas da conta
      const { data: sales, error: salesErr } = await supabase
        .from("sales")
        .select("miles_used")
        .eq("account_id", accountId)
        .neq("status", "cancelado");
      if (salesErr) throw salesErr;

      // Calcula saldo correto
      const entriesSum = confirmedEntries
        .reduce((s, e) => s + Number(e.miles_generated ?? e.amount), 0);
      const salesSum = (sales ?? [])
        .reduce((s, sa) => s + Number(sa.miles_used), 0);
      const newBalance = Math.max(0, entriesSum - salesSum);

      // Recalcula totalInvested das entradas
      const investedSum = confirmedEntries
        .reduce((s, e) => s + Number(e.amount_paid ?? 0), 0);

      // Aproxima custo proporcional das vendas
      const entryAvgCost = entriesSum > 0 ? investedSum / entriesSum : 0;
      const investedDeduction = entryAvgCost * salesSum;
      const newInvested = Math.max(0, investedSum - investedDeduction);
      const newAvgCost = newBalance > 0 ? newInvested / newBalance : 0;

      // Atualiza a conta
      const { error: updateErr } = await supabase
        .from("accounts")
        .update({
          balance: newBalance,
          total_invested: newInvested,
          average_cost_per_mile: newAvgCost,
        })
        .eq("id", accountId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["entries"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: 'all' });
      toast.success("Saldo recalculado com sucesso");
    },
    onError: (err) => {
      logError("recalcAccount", err);
      toast.error("Erro ao recalcular saldo");
    },
  });
}
