import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "./entradasApi";
import type { PointEntry } from "@/types";

const INVALIDATE: ("entries" | "accounts")[] = ["entries", "accounts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddEntryMutation() {
  const [trigger, result] = entradasApi.useAddEntryMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (entry: PointEntry, options?: MutateOptions) => {
    trigger(entry)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addEntry", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao salvar entrada");
      });
  };

  const mutateAsync = async (entry: PointEntry) => {
    try {
      await trigger(entry).unwrap();
      invalidate();
    } catch (err) {
      logError("addEntry", err);
      invalidate();
      toast.error("Erro ao salvar entrada");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useConfirmEntryMutation() {
  const [trigger, result] = entradasApi.useConfirmEntryMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (entry: PointEntry, options?: MutateOptions) => {
    trigger(entry)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("confirmEntry", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao confirmar entrada");
      });
  };

  const mutateAsync = async (entry: PointEntry) => {
    try {
      await trigger(entry).unwrap();
      invalidate();
    } catch (err) {
      logError("confirmEntry", err);
      invalidate();
      toast.error("Erro ao confirmar entrada");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
