import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { logError, logDestructiveOp } from "@/lib/logger";
import { clientesApi } from "./clientesApi";

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useDeleteClientMutation() {
  const [trigger, result] = clientesApi.useDeleteClientMutation();
  const queryClient = useQueryClient();
  const invalidateSales = () =>
    queryClient.invalidateQueries({ queryKey: ["sales"], refetchType: "all" });

  const mutate = (id: string, options?: MutateOptions) => {
    trigger(id)
      .unwrap()
      .then(() => {
        void invalidateSales();
        logDestructiveOp("delete", "client");
        toast.success("Cliente excluído com sucesso");
        options?.onSuccess?.();
      })
      .catch((err) => {
        logError("deleteClient", err);
        options?.onError?.();
        toast.error("Erro ao excluir cliente");
      });
  };
  const mutateAsync = async (id: string, options?: MutateOptions) => {
    try {
      await trigger(id).unwrap();
      await invalidateSales();
      logDestructiveOp("delete", "client");
      toast.success("Cliente excluído com sucesso");
      options?.onSuccess?.();
    } catch (err) {
      logError("deleteClient", err);
      options?.onError?.();
      toast.error("Erro ao excluir cliente");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
