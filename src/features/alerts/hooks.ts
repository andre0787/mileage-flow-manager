import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { useUserId } from "@/hooks/useDatabase/shared";
import { alertsApi } from "./alertsApi";

const INVALIDATE: "alerts"[] = ["alerts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAccountAlerts() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = alertsApi.useGetAccountAlertsQuery(
    userId ?? "",
    { skip: !userId },
  );
  return { data, isPending: isLoading, isError, error, refetch };
}

export function useAddAccountAlertMutation() {
  const [trigger, result] = alertsApi.useAddAccountAlertMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = (
    alert: { accountId: string; date: string; observation: string },
    options?: MutateOptions,
  ) => {
    trigger(alert)
      .unwrap()
      .then(() => {
        invalidate();
        toast.success("Alerta adicionado");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addAccountAlert", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao adicionar alerta");
      });
  };

  const mutateAsync = async (
    alert: { accountId: string; date: string; observation: string },
    options?: MutateOptions,
  ) => {
    try {
      const res = await trigger(alert).unwrap();
      invalidate();
      toast.success("Alerta adicionado");
      options?.onSuccess?.();
      return res;
    } catch (err) {
      logError("addAccountAlert", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao adicionar alerta");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useToggleAccountAlertMutation() {
  const [trigger, result] = alertsApi.useToggleAccountAlertMutation();
  const dispatch = useAppDispatch();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(INVALIDATE));

  const mutate = ({ id, read }: { id: string; read: boolean }, options?: MutateOptions) => {
    trigger({ id, read })
      .unwrap()
      .then(() => {
        invalidate();
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("toggleAccountAlert", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar alerta");
      });
  };

  const mutateAsync = async (
    { id, read }: { id: string; read: boolean },
    options?: MutateOptions,
  ) => {
    try {
      const res = await trigger({ id, read }).unwrap();
      invalidate();
      options?.onSuccess?.();
      return res;
    } catch (err) {
      logError("toggleAccountAlert", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar alerta");
      throw err;
    }
  };

  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}