import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError, logDestructiveOp } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { ownersApi } from "./ownersApi";
import type { Owner } from "@/types";

const INVALIDATE: ("owners")[] = ["owners"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddOwnerMutation() {
  const [trigger, result] = ownersApi.useAddOwnerMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (owner: Owner, options?: MutateOptions) => {
    trigger(owner)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addOwner", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao criar dono");
      });
  };

  const mutateAsync = async (owner: Owner, options?: MutateOptions) => {
    try {
      await trigger(owner).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("addOwner", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao criar dono");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateOwnerMutation() {
  const [trigger, result] = ownersApi.useUpdateOwnerMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (input: Partial<Owner> & { id: string }, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateOwner", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar dono");
      });
  };

  const mutateAsync = async (input: Partial<Owner> & { id: string }, options?: MutateOptions) => {
    try {
      await trigger(input).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("updateOwner", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar dono");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useDeleteOwnerMutation() {
  const [trigger, result] = ownersApi.useDeleteOwnerMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        invalidate();
        logDestructiveOp("delete", "owner");
        toast.success("Dono excluído com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteOwner", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao excluir dono");
      });
  };

  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      invalidate();
      logDestructiveOp("delete", "owner");
      toast.success("Dono excluído com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteOwner", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao excluir dono");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}