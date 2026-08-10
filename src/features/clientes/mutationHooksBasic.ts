import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useUserId } from "@/hooks/useDatabase/shared";
import { logError } from "@/lib/logger";
import { clientesApi } from "./clientesApi";
import type { Client } from "@/types";

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddClientMutation() {
  const [trigger, result] = clientesApi.useAddClientMutation();
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const refetchClients = async () => {
    if (!userId) return;
    await dispatch(
      clientesApi.endpoints.getClients.initiate(userId, { forceRefetch: true, subscribe: false }),
    ).unwrap();
  };
  const mutate = (client: Client, options?: MutateOptions) => {
    trigger(client)
      .unwrap()
      .then(() => {
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addClient", err);
        options?.onError?.();
        toast.error("Erro ao criar cliente");
      });
  };
  const mutateAsync = async (client: Client, options?: MutateOptions) => {
    try {
      await trigger(client).unwrap();
      await refetchClients();
      options?.onSuccess?.();
    } catch (err) {
      logError("addClient", err);
      options?.onError?.();
      toast.error("Erro ao criar cliente");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateClientMutation() {
  const [trigger, result] = clientesApi.useUpdateClientMutation();
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const refetchClients = async () => {
    if (!userId) return;
    await dispatch(
      clientesApi.endpoints.getClients.initiate(userId, { forceRefetch: true, subscribe: false }),
    ).unwrap();
  };
  const mutate = (input: Partial<Client> & { id: string }, options?: MutateOptions) => {
    trigger(input)
      .unwrap()
      .then(() => {
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("updateClient", err);
        options?.onError?.();
        toast.error("Erro ao atualizar cliente");
      });
  };
  const mutateAsync = async (input: Partial<Client> & { id: string }, options?: MutateOptions) => {
    try {
      await trigger(input).unwrap();
      await refetchClients();
      options?.onSuccess?.();
    } catch (err) {
      logError("updateClient", err);
      options?.onError?.();
      toast.error("Erro ao atualizar cliente");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
