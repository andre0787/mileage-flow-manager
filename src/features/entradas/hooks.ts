import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useUserId } from "@/hooks/useDatabase/shared";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { entradasApi } from "./entradasApi";
import type { PointEntry } from "@/types";

// ponytail: wrappers de compatibilidade — preservam o shape público dos hooks
// TanStack (useEntriesQuery/useAddEntryMutation/...) para os consumidores atuais
// (DataContext, Entradas.tsx, DeleteEntryDialog). Os toasts/logError que viviam
// em onSuccess/onError do TanStack movem-se para cá (mesmo comportamento).

const INVALIDATE: ("entries" | "accounts")[] = ["entries", "accounts"];

interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useEntriesQuery() {
  const userId = useUserId();
  const { data, isLoading, isError, error, refetch } = entradasApi.useGetEntriesQuery(
    userId ?? "",
    {
      skip: !userId,
    },
  );
  return { data, isPending: isLoading, isError, error, refetch };
}

export { useAddEntryMutation, useConfirmEntryMutation } from "./mutationHooksBasic";
export { useUpdateEntryMutation, useDeleteEntryMutation } from "./mutationHooksLifecycle";
