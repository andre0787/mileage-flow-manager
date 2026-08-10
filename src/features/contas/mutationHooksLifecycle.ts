import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useQueryClient } from "@tanstack/react-query";
import { logError, logDestructiveOp } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { contasApi } from "./contasApi";

const ACCOUNT_TAGS: ("accounts" | "entries" | "sales")[] = ["accounts", "entries", "sales"];
interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useDeleteAccountMutation() {
  const [trigger, result] = contasApi.useDeleteAccountMutation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(ACCOUNT_TAGS));
  const invalidateSales = () =>
    queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: "all" });

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        void invalidateSales();
        logDestructiveOp("delete", "account");
        toast.success("Conta excluída com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteAccount", err);
        invalidate();
        void invalidateSales();
        options?.onError?.();
        toast.error("Erro ao excluir conta");
      });
  };
  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      await invalidateSales();
      logDestructiveOp("delete", "account");
      toast.success("Conta excluída com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteAccount", err);
      invalidate();
      void invalidateSales();
      options?.onError?.();
      toast.error("Erro ao excluir conta");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useRecalcAccountMutation() {
  const [trigger, result] = contasApi.useRecalcAccountMutation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(ACCOUNT_TAGS));
  const invalidateSales = () =>
    queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: "all" });

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        void invalidateSales();
        toast.success("Saldo recalculado com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("recalcAccount", err);
        invalidate();
        void invalidateSales();
        options?.onError?.();
        toast.error("Erro ao recalcular saldo");
      });
  };
  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      await invalidateSales();
      toast.success("Saldo recalculado com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("recalcAccount", err);
      invalidate();
      void invalidateSales();
      options?.onError?.();
      toast.error("Erro ao recalcular saldo");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
