import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { vendasApi } from "./vendasApi";
import { selectAllSales, selectSaleEntities } from "./adapter";

export function useSalesQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = vendasApi.useGetVendasQuery(userId ?? "", {
    skip: !userId,
  });
  const data = useMemo(() => (entityState ? selectAllSales(entityState) : []), [entityState]);
  const byId = useMemo(() => (entityState ? selectSaleEntities(entityState) : {}), [entityState]);
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export { useAddSaleMutation, useUpdateSaleMutation } from "./mutationHooksBasic";
export { useDeleteSaleMutation, useCancelSaleMutation } from "./mutationHooksLifecycle";
