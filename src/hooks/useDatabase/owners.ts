import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import type { Owner } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useUserId } from "./shared";
import { mapOwner } from "./mappers";

type OwnerInsert = Database["public"]["Tables"]["owners"]["Insert"];

export function useOwnersQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["owners", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("owners").select("*");
      if (error) throw error;
      return (data ?? []).map(mapOwner);
    },
    enabled: !!userId,
  });
}

export function useAddOwnerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (owner: Owner) => {
      const row: OwnerInsert = {
        id: owner.id, user_id: user!.id, name: owner.name, cpf: owner.cpf, phone: owner.phone,
      };
      const { error } = await supabase.from("owners").insert(row);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useUpdateOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Owner> & { id: string }) => {
      const { error } = await supabase.from("owners").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useDeleteOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}