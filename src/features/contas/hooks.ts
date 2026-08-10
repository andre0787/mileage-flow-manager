import { useUserId } from "@/hooks/useDatabase/shared";
import { contasApi } from "./contasApi";

export function useAccountsQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = contasApi.useGetAccountsQuery(userId ?? "", {
    skip: !userId,
  });
  return { data, isPending: isLoading, isError, error, refetch };
}

export { useAddAccountMutation, useUpdateAccountMutation } from "./mutationHooksBasic";
export { useDeleteAccountMutation, useRecalcAccountMutation } from "./mutationHooksLifecycle";
