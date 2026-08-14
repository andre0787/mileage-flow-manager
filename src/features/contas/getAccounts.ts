import { supabase, mapAccount, toQueryError } from "./shared";
import { toAccountsEntityState } from "./adapter";
import type { Account, ContasBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getAccountsEndpoint = (builder: ContasBuilder) => ({
  getAccounts: builder.query<EntityState<Account, string>, string>({
    providesTags: ["accounts"],
    queryFn: async (userId) => {
      if (!userId) return { data: toAccountsEntityState([]) };
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) return { error: toQueryError(error) };
      // ponytail: normaliza o cache via createEntityAdapter (rule-44) — os
      // consumidores recebem o array derivado pelos seletores memoizados.
      return { data: toAccountsEntityState((data ?? []).map(mapAccount)) };
    },
  }),
});
