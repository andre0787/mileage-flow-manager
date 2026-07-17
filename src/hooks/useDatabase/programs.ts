import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase-types";
import { useAuth } from "@/contexts/AuthContext";
import { logError, logDestructiveOp } from "@/lib/logger";
import type { Program } from "@/types";
import { useUserId } from "./shared";
import { mapProgram } from "./mappers";

type ProgramUpdate = Database["public"]["Tables"]["programs"]["Update"];

export function useProgramsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["programs", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*");
      if (error) throw error;
      return (data ?? []).map(mapProgram);
    },
    enabled: !!userId,
  });
}

export function useAddProgramMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: async (program: Program) => {
      const { error } = await supabase.from("programs").insert({
        id: program.id,
        user_id: user!.id,
        name: program.name,
        type: program.type,
        max_passengers: program.maxPassengers,
        passenger_cycle_type: program.passengerCycleType,
        passenger_cycle_days: program.passengerCycleDays,
      });
      if (error) throw error;

      if (program.type === "pontos") {
        const { error: otError } = await supabase.from("origem_types").upsert(
          {
            id: program.id,
            user_id: user!.id,
            name: program.name,
            account_type: "pontos",
            color: "#3b82f6",
          },
          { onConflict: "id" },
        );
        if (otError) throw otError;
      }
    },
    onSuccess: async (_data, variables) => {
      // ponytail: optimistic cache update so dropdown shows new program instantly
      if (userId) {
        queryClient.setQueryData<Program[]>(["programs", userId], (old) => {
          if (!old) return [variables];
          if (old.some((p) => p.id === variables.id)) return old;
          return [...old, variables];
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["programs"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: 'all' }),
      ]);
    },
    onError: (err) => {
      logError("addProgram", err);
      toast.error("Erro ao criar programa");
    },
  });
}

export function useUpdateProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Program> & { id: string }) => {
      const updateData: ProgramUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.maxPassengers !== undefined) updateData.max_passengers = data.maxPassengers;
      if (data.passengerCycleType !== undefined)
        updateData.passenger_cycle_type = data.passengerCycleType;
      if (data.passengerCycleDays !== undefined)
        updateData.passenger_cycle_days = data.passengerCycleDays;
      const { error } = await supabase.from("programs").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"], refetchType: 'all' });
    },
    onError: (err) => {
      logError("updateProgram", err);
      toast.error("Erro ao atualizar programa");
    },
  });
}

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["programs"], refetchType: 'all' });
      logDestructiveOp("delete", "program");
      toast.success("Programa excluído com sucesso");
    },
    onError: (err) => {
      logError("deleteProgram", err);
      toast.error("Erro ao excluir programa");
    },
  });
}
