import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { origemTypesApi } from "./origemTypesApi";
import { selectAllOrigemTypes, selectOrigemTypeEntities } from "./adapter";

export function useOrigemTypesQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = origemTypesApi.useGetOrigemTypesQuery(userId ?? "", {
    skip: !userId,
  });
  const data = useMemo(() => (entityState ? selectAllOrigemTypes(entityState) : []), [entityState]);
  const byId = useMemo(
    () => (entityState ? selectOrigemTypeEntities(entityState) : {}),
    [entityState],
  );
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export {
  useAddOrigemTypeMutation,
  useUpdateOrigemTypeMutation,
  useDeleteOrigemTypeMutation,
} from "./mutationHooksLifecycle";
