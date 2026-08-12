import { useUserId } from "@/hooks/useDatabase/shared";
import { programsApi } from "./programsApi";

export function useProgramsQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = programsApi.useGetProgramsQuery(
    userId ?? "",
    {
      skip: !userId,
    },
  );
  return { data, isPending: isLoading, isError, error, refetch };
}

export {
  useAddProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
} from "./mutationHooksLifecycle";
