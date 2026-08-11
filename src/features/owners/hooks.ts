import { useUserId } from "@/hooks/useDatabase/shared";
import { ownersApi } from "./ownersApi";

export function useOwnersQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = ownersApi.useGetOwnersQuery(userId ?? "", {
    skip: !userId,
  });
  return { data, isPending: isLoading, isError, error, refetch };
}

export {
  useAddOwnerMutation,
  useUpdateOwnerMutation,
  useDeleteOwnerMutation,
} from "./mutationHooksLifecycle";