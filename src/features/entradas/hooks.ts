import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useUserId } from "@/hooks/useDatabase/shared";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "./entradasApi";
import type { PointEntry } from "@/types";

// ponytail: wrappers de compatibilidade — preservam o shape público dos hooks
// TanStack (useEntriesQuery/useAddEntryMutation/...) para os consumidores atuais
// (DataContext, Entradas.tsx, DeleteEntryDialog). Os toasts/logError que viviam
// em onSuccess/onError do TanStack movem-se para cá (mesmo comportamento).

const INVALIDATE: ("entries" | "accounts")[] = ["entries", "accounts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useEntriesQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = entradasApi.useGetEntriesQuery(
    userId ?? "",
    {
      skip: !userId,
    },
  );
  return { data, isPending: isLoading, isError, error, refetch };
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

export function useUpdateEntryMutation() {
  const [trigger, result] = entradasApi.useUpdateEntryMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (
    args: { oldEntry: PointEntry; updates: Partial<PointEntry> },
    options?: MutateOptions,
  ) => {
    trigger(args)
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateEntry", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar entrada");
      });
  };

  const mutateAsync = async (args: { oldEntry: PointEntry; updates: Partial<PointEntry> }) => {
    try {
      await trigger(args).unwrap();
      invalidate();
    } catch (err) {
      logError("updateEntry", err);
      invalidate();
      toast.error("Erro ao atualizar entrada");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useDeleteEntryMutation() {
  const [trigger, result] = entradasApi.useDeleteEntryMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (entry: PointEntry, options?: MutateOptions) => {
    trigger(entry)
      .unwrap()
      .then(() => {
        invalidate();
        toast.success("Entrada excluída com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteEntry", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao excluir entrada");
      });
  };

  const mutateAsync = async (entry: PointEntry) => {
    try {
      await trigger(entry).unwrap();
      invalidate();
      toast.success("Entrada excluída com sucesso");
    } catch (err) {
      logError("deleteEntry", err);
      invalidate();
      toast.error("Erro ao excluir entrada");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
