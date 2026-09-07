import { useMemo } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useUserId } from "@/hooks/useDatabase/shared";
import { logError } from "@/lib/logger";
import { calcCreditBalance } from "@/lib/clientCredits";
import { clientesApi } from "./clientesApi";
import { selectAllClients, selectClientEntities } from "./adapter";
import type { AddClientAdvanceInput } from "@/types";

export function useClientsQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = clientesApi.useGetClientsQuery(userId ?? "", { skip: !userId });
  const data = useMemo(() => (entityState ? selectAllClients(entityState) : []), [entityState]);
  const byId = useMemo(() => (entityState ? selectClientEntities(entityState) : {}), [entityState]);
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export { useAddClientMutation, useUpdateClientMutation } from "./mutationHooksBasic";
export { useDeleteClientMutation } from "./mutationHooksLifecycle";

/** Adiantamento: dinheiro recebido do cliente antes de qualquer emissão. */
export function useAddClientAdvanceMutation() {
  const [trigger, result] = clientesApi.useAddClientAdvanceMutation();
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const refetchCredits = async (clientId: string) => {
    await dispatch(
      clientesApi.endpoints.getClientCredits.initiate(clientId, {
        forceRefetch: true,
        subscribe: false,
      }),
    ).unwrap();
    if (userId) {
      await dispatch(
        clientesApi.endpoints.getAllClientCredits.initiate(undefined, {
          forceRefetch: true,
          subscribe: false,
        }),
      ).unwrap();
    }
  };
  const mutate = (
    input: AddClientAdvanceInput,
    options?: { onSuccess?: () => void; onError?: () => void },
  ) => {
    trigger(input)
      .unwrap()
      .then(async () => {
        await refetchCredits(input.clientId);
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("addClientAdvance", err);
        options?.onError?.();
        toast.error("Erro ao registrar adiantamento");
      });
  };
  const mutateAsync = async (
    input: AddClientAdvanceInput,
    options?: { onSuccess?: () => void; onError?: () => void },
  ) => {
    try {
      await trigger(input).unwrap();
      await refetchCredits(input.clientId);
      options?.onSuccess?.();
    } catch (err) {
      logError("addClientAdvance", err);
      options?.onError?.();
      toast.error("Erro ao registrar adiantamento");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useClientCreditsQuery(clientId: string) {
  const { data, isLoading, isError, error, refetch } = clientesApi.useGetClientCreditsQuery(
    clientId,
    { skip: !clientId },
  );
  return { data: data ?? [], isPending: isLoading, isError, error, refetch };
}

/** Todos os movimentos de crédito (uma leitura p/ relatório de cobrança). */
export function useAllClientCreditsQuery() {
  const { data, isLoading, isError, error, refetch } =
    clientesApi.useGetAllClientCreditsQuery(undefined);
  return { data: data ?? [], isPending: isLoading, isError, error, refetch };
}

export function useClientBalanceQuery(clientId: string) {
  const { data, ...rest } = useClientCreditsQuery(clientId);
  const balance = useMemo(() => calcCreditBalance(data), [data]);
  return { balance, movements: data, ...rest };
}
