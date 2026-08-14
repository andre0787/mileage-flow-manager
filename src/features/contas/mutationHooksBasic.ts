import { toast } from "sonner";
import { useAppDispatch } from "@/features/store";
import { useUserId } from "@/hooks/useDatabase/shared";
import { logError } from "@/lib/logger";
import { baseApi } from "@/features/api/baseApi";
import { contasApi } from "./contasApi";
import type { Account } from "@/types";

const ACCOUNT_TAGS: ("accounts" | "entries" | "sales")[] = ["accounts"];
interface MutateOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useAddAccountMutation() {
  const [trigger, result] = contasApi.useAddAccountMutation();
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(ACCOUNT_TAGS));
  const patchAccounts = (account: Account) =>
    userId
      ? dispatch(
          contasApi.util.updateQueryData("getAccounts", userId, (draft) => {
            // cache normalizado (rule-44): upsert no mapa de entidades
            draft.entities[account.id] = account;
            if (!draft.ids.includes(account.id)) draft.ids.push(account.id);
          }),
        )
      : undefined;

  const mutate = (account: Account, options?: MutateOptions) => {
    const patch = patchAccounts(account);
    trigger(account)
      .unwrap()
      .then(() => options?.onSuccess?.())
      .catch((err) => {
        patch?.undo();
        logError("addAccount", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao criar conta");
      });
  };
  const mutateAsync = async (account: Account, options?: MutateOptions) => {
    const patch = patchAccounts(account);
    try {
      await trigger(account).unwrap();
      options?.onSuccess?.();
    } catch (err) {
      patch?.undo();
      logError("addAccount", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao criar conta");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}

export function useUpdateAccountMutation() {
  const [trigger, result] = contasApi.useUpdateAccountMutation();
  const dispatch = useAppDispatch();
  const userId = useUserId();
  const invalidate = () => dispatch(baseApi.util.invalidateTags(ACCOUNT_TAGS));

  const mutate = (input: Partial<Account> & { id: string }, options?: MutateOptions) => {
    const patch = userId
      ? dispatch(
          contasApi.util.updateQueryData("getAccounts", userId, (draft) => {
            const account = draft.entities[input.id];
            if (account) Object.assign(account, input);
          }),
        )
      : undefined;
    trigger(input)
      .unwrap()
      .then(() => options?.onSuccess?.())
      .catch((err) => {
        patch?.undo();
        logError("updateAccount", err);
        invalidate();
        options?.onError?.();
        toast.error("Erro ao atualizar conta");
      });
  };
  const mutateAsync = async (input: Partial<Account> & { id: string }, options?: MutateOptions) => {
    const patch = userId
      ? dispatch(
          contasApi.util.updateQueryData("getAccounts", userId, (draft) => {
            const account = draft.entities[input.id];
            if (account) Object.assign(account, input);
          }),
        )
      : undefined;
    try {
      await trigger(input).unwrap();
      options?.onSuccess?.();
    } catch (err) {
      patch?.undo();
      logError("updateAccount", err);
      invalidate();
      options?.onError?.();
      toast.error("Erro ao atualizar conta");
      throw err;
    }
  };
  return { mutate, mutateAsync, isPending: result.isLoading, ...result };
}
