import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAddEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry) => {
      const { data, error } = await supabase.from("entries").insert(entry);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // ponytail: sem invalidateQueries, sem calcAccountUpdate
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}
