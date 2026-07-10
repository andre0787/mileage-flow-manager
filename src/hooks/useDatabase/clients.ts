import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import type { Client } from "@/types";
import { useUserId } from "./shared";
import { mapClient } from "./mappers";

type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export function useClientsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["clients", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return (data ?? []).map(mapClient);
    },
    enabled: !!userId,
  });
}

export function useAddClientMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (client: Client) => {
      const { error } = await supabase.from("clients").insert({
        id: client.id,
        user_id: user!.id,
        name: client.name,
        cpf: client.cpf,
        email: client.email,
        phone: client.phone,
        telegram: client.telegram,
        total_purchases: client.totalPurchases,
        usage_history: client.usageHistory,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
    onError: () => toast.error("Erro ao criar cliente"),
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const updateData: ClientUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.cpf !== undefined) updateData.cpf = data.cpf;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.telegram !== undefined) updateData.telegram = data.telegram;
      if (data.totalPurchases !== undefined) updateData.total_purchases = data.totalPurchases;
      if (data.usageHistory !== undefined) updateData.usage_history = data.usageHistory;
      const { error } = await supabase.from("clients").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
    onError: () => toast.error("Erro ao atualizar cliente"),
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Cliente excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir cliente"),
  });
}
