import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAddSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sale) => {
      const { data, error } = await supabase.from("sales").insert(sale);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"], refetchType: "all" });
    },
  });
}
