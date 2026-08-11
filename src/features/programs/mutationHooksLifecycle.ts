import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError, logDestructiveOp } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { programsApi } from "./programsApi";
import type { Program } from "@/types";

const INVALIDATE: ("programs" | "origem_types")[] = ["programs", "origem_types"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddProgramMutation() {
  const [trigger, result] = programsApi.useAddProgramMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (program: Program, options?: MutateOptions) => {
    trigger(program)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addProgram", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao criar programa");
      });
  };

  const mutateAsync = async (program: Program, options?: MutateOptions) => {
    try {
      await trigger(program).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("addProgram", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao criar programa");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateProgramMutation() {
  const [trigger, result] = programsApi.useUpdateProgramMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(["programs"]));

  const mutate = (input: Partial<Program> & { id: string }, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateProgram", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar programa");
      });
  };

  const mutateAsync = async (input: Partial<Program> & { id: string }, options?: MutateOptions) => {
    try {
      await trigger(input).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("updateProgram", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar programa");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useDeleteProgramMutation() {
  const [trigger, result] = programsApi.useDeleteProgramMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(["programs"]));

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        invalidate();
        logDestructiveOp("delete", "program");
        toast.success("Programa excluído com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteProgram", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao excluir programa");
      });
  };

  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      invalidate();
      logDestructiveOp("delete", "program");
      toast.success("Programa excluído com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteProgram", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao excluir programa");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
