import { useMemo } from "react";
import { useUserId } from "@/hooks/useDatabase/shared";
import { programsApi } from "./programsApi";
import { selectAllPrograms, selectProgramEntities } from "./adapter";

export function useProgramsQuery() {
  const userId = useUserId();
  const {
    data: entityState,
    isLoading,
    isError,
    error,
    refetch,
  } = programsApi.useGetProgramsQuery(userId ?? "", {
    skip: !userId,
  });
  const data = useMemo(() => (entityState ? selectAllPrograms(entityState) : []), [entityState]);
  const byId = useMemo(
    () => (entityState ? selectProgramEntities(entityState) : {}),
    [entityState],
  );
  return { data, byId, isPending: isLoading, isError, error, refetch };
}

export {
  useAddProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
} from "./mutationHooksLifecycle";
