import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError, logDestructiveOp } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { origemTypesApi } from "./origemTypesApi";
import type { OrigemType } from "@/types";

const INVALIDATE: "origem_types"[] = ["origem_types"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddOrigemTypeMutation() {
  const [trigger, result] = origemTypesApi.useAddOrigemTypeMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (ot: OrigemType, options?: MutateOptions) => {
    trigger(ot)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addOrigemType", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao criar tipo de operação");
      });
  };

  const mutateAsync = async (ot: OrigemType, options?: MutateOptions) => {
    try {
      await trigger(ot).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("addOrigemType", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao criar tipo de operação");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateOrigemTypeMutation() {
  const [trigger, result] = origemTypesApi.useUpdateOrigemTypeMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (input: Partial<OrigemType> & { id: string }, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateOrigemType", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar tipo de operação");
      });
  };

  const mutateAsync = async (
    input: Partial<OrigemType> & { id: string },
    options?: MutateOptions,
  ) => {
    try {
      await trigger(input).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("updateOrigemType", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar tipo de operação");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useDeleteOrigemTypeMutation() {
  const [trigger, result] = origemTypesApi.useDeleteOrigemTypeMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        invalidate();
        logDestructiveOp("delete", "origem_type");
        toast.success("Tipo de operação excluído com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteOrigemType", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao excluir tipo de operação");
      });
  };

  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      invalidate();
      logDestructiveOp("delete", "origem_type");
      toast.success("Tipo de operação excluído com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteOrigemType", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao excluir tipo de operação");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
