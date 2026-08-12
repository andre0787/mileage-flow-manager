import { useUserId } from "@/hooks/useDatabase/shared";
import { origemTypesApi } from "./origemTypesApi";

export function useOrigemTypesQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = origemTypesApi.useGetOrigemTypesQuery(
    userId ?? "",
    {
      skip: !userId,
    },
  );
  return { data, isPending: isLoading, isError, error, refetch };
}

export {
  useAddOrigemTypeMutation,
  useUpdateOrigemTypeMutation,
  useDeleteOrigemTypeMutation,
} from "./mutationHooksLifecycle";
