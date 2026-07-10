import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
    onError: () => toast.error("Erro ao criar conta"),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
    onError: () => toast.error("Erro ao atualizar conta"),
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
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: () => toast.error("Erro ao excluir conta"),
  });
}
