import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { vendasApi } from "./vendasApi";
import type { Sale, ReceiveWithCreditInput } from "@/types";

const INVALIDATE: ("sales" | "accounts")[] = ["sales", "accounts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddSaleMutation() {
  const [trigger, result] = vendasApi.useAddVendaMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (sale: Sale, options?: MutateOptions) => {
    trigger(sale)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addSale", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao criar venda");
      });
  };

  const mutateAsync = async (sale: Sale, options?: MutateOptions) => {
    try {
      await trigger(sale).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("addSale", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao criar venda");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateSaleMutation() {
  const [trigger, result] = vendasApi.useUpdateVendaMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (input: Partial<Sale> & { id: string }, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateSale", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar venda");
      });
  };

  const mutateAsync = async (input: Partial<Sale> & { id: string }, options?: MutateOptions) => {
    try {
      await trigger(input).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("updateSale", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar venda");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

const CREDIT_INVALIDATE: ("sales" | "accounts" | "clients")[] = ["sales", "accounts", "clients"];

export function useReceiveWithCreditMutation() {
  const [trigger, result] = vendasApi.useReceiveWithCreditMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(CREDIT_INVALIDATE));

  const mutate = (input: ReceiveWithCreditInput, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("receiveWithCredit", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao registrar recebimento");
      });
  };

  const mutateAsync = async (input: ReceiveWithCreditInput, options?: MutateOptions) => {
    try {
      await trigger(input).unwrap();
      invalidate();
      options?.onSuccess?.();
    } catch (err) {
      logError("receiveWithCredit", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao registrar recebimento");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
