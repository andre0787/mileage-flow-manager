import { useUserId } from "@/hooks/useDatabase/shared";
import { vendasApi } from "./vendasApi";

export function useSalesQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = vendasApi.useGetVendasQuery(userId ?? "", {
    skip: !userId,
  });
  return { data, isPending: isLoading, isError, error, refetch };
}

export { useAddSaleMutation, useUpdateSaleMutation } from "./mutationHooksBasic";
export { useDeleteSaleMutation, useCancelSaleMutation } from "./mutationHooksLifecycle";
