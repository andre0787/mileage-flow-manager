import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError, logDestructiveOp } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { vendasApi } from "./vendasApi";

const INVALIDATE: ("sales" | "accounts")[] = ["sales", "accounts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useDeleteSaleMutation() {
  const [trigger, result] = vendasApi.useDeleteVendaMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        invalidate();
        logDestructiveOp("delete", "sale");
        toast.success("Venda excluída com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteSale", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao excluir venda");
      });
  };

  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      invalidate();
      logDestructiveOp("delete", "sale");
      toast.success("Venda excluída com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteSale", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao excluir venda");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useCancelSaleMutation() {
  const [trigger, result] = vendasApi.useCancelVendaMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        invalidate();
        logDestructiveOp("cancel", "sale");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("cancelSale", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao cancelar venda");
      });
  };

  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      invalidate();
      logDestructiveOp("cancel", "sale");
      options?.onSuccess?.();
    } catch (err) {
      logError("cancelSale", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao cancelar venda");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}