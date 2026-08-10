import { useUserId } from "@/hooks/useDatabase/shared";
import { clientesApi } from "./clientesApi";

export function useClientsQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = clientesApi.useGetClientsQuery(
    userId ?? "",
    { skip: !userId },
  );
  return { data, isPending: isLoading, isError, error, refetch };
}

export { useAddClientMutation, useUpdateClientMutation } from "./mutationHooksBasic";
export { useDeleteClientMutation } from "./mutationHooksLifecycle";
