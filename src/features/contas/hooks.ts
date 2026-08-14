import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { contasApi } from "./contasApi";
import { selectAllAccounts, selectAccountEntities } from "./adapter";

export function useAccountsQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = contasApi.useGetAccountsQuery(userId ?? "", {
    skip: !userId,
  });
  // ponytail: shape público preservado (array) — derivado do cache normalizado
  // via seletores memoizados do createEntityAdapter (rule-44).
  const data = useMemo(() => (entityState ? selectAllAccounts(entityState) : []), [entityState]);
  const byId = useMemo(
    () => (entityState ? selectAccountEntities(entityState) : {}),
    [entityState],
  );
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export { useAddAccountMutation, useUpdateAccountMutation } from "./mutationHooksBasic";
export { useDeleteAccountMutation, useRecalcAccountMutation } from "./mutationHooksLifecycle";
