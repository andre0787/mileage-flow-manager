import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { ownersApi } from "./ownersApi";
import { selectAllOwners, selectOwnerEntities } from "./adapter";

export function useOwnersQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = ownersApi.useGetOwnersQuery(userId ?? "", {
    skip: !userId,
  });
  const data = useMemo(() => (entityState ? selectAllOwners(entityState) : []), [entityState]);
  const byId = useMemo(() => (entityState ? selectOwnerEntities(entityState) : {}), [entityState]);
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export {
  useAddOwnerMutation,
  useUpdateOwnerMutation,
  useDeleteOwnerMutation,
} from "./mutationHooksLifecycle";
