import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUserId } from "./shared";
import { logError } from "@/lib/logger";
import type { AccountAlert } from "@/types";

interface AlertRow {
  id: string;
  account_id: string;
  user_id: string;
  date: string;
  observation: string;
  read: boolean;
  created_at: string;
}

function mapAlert(row: AlertRow): AccountAlert {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    date: row.date,
    observation: row.observation,
    read: row.read,
    createdAt: row.created_at,
  };
}

export function useAccountAlerts() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["account_alerts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_alerts")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapAlert);
    },
    enabled: !!userId,
  });
}

export function useAddAccountAlertMutation() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (alert: { accountId: string; date: string; observation: string }) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("account_alerts").insert({
        account_id: alert.accountId,
        user_id: userId,
        date: alert.date,
        observation: alert.observation,
        read: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account_alerts"], refetchType: "all" });
      toast.success("Alerta adicionado");
    },
    onError: (err) => {
      logError("addAccountAlert", err);
      toast.error("Erro ao adicionar alerta");
    },
  });
}

export function useToggleAccountAlertMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.from("account_alerts").update({ read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account_alerts"], refetchType: "all" });
    },
    onError: (err) => {
      logError("toggleAccountAlert", err);
      toast.error("Erro ao atualizar alerta");
    },
  });
}
