import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { clientesApi } from "./clientesApi";
import { selectAllClients, selectClientEntities } from "./adapter";

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
