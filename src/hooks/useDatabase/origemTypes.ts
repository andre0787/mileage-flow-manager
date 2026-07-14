import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import { logError, logDestructiveOp } from "@/lib/logger";
import type { OrigemType } from "@/types";
import { useUserId } from "./shared";
import { mapOrigemType } from "./mappers";

type OrigemTypeInsert = Database["public"]["Tables"]["origem_types"]["Insert"];
type OrigemTypeUpdate = Database["public"]["Tables"]["origem_types"]["Update"];

export function useOrigemTypesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["origem_types", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("origem_types").select("*");
      if (error) throw error;
      return (data ?? []).map(mapOrigemType);
    },
    enabled: !!userId,
  });
}

export function useAddOrigemTypeMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ot: OrigemType) => {
      const data: OrigemTypeInsert = {
        id: ot.id, user_id: user!.id, name: ot.name, account_type: ot.accountType, color: ot.color,
      };
      // ponytail: description column added by migration; only include if defined so it works pre-migration
      if (ot.description !== undefined) data.description = ot.description;
      const { error } = await supabase.from("origem_types").insert(data);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: 'all' }),
    onError: (err) => {
      logError("addOrigemType", err);
      toast.error("Erro ao criar tipo de operação");
    },
  });
}

export function useUpdateOrigemTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OrigemType> & { id: string }) => {
      const updateData: OrigemTypeUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.accountType !== undefined) updateData.account_type = data.accountType;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.description !== undefined) updateData.description = data.description;
      const { error } = await supabase.from("origem_types").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: 'all' }),
    onError: (err) => {
      logError("updateOrigemType", err);
      toast.error("Erro ao atualizar tipo de operação");
    },
  });
}

export function useDeleteOrigemTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("origem_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: 'all' });
      logDestructiveOp("delete", "origem_type");
      toast.success("Tipo de operação excluído com sucesso");
    },
    onError: (err) => {
      logError("deleteOrigemType", err);
      toast.error("Erro ao excluir tipo de operação");
    },
  });
}