import { supabase, mapAccount, toQueryError } from "./shared";
import type { Account, ContasBuilder } from "./shared";

export const getAccountsEndpoint = (builder: ContasBuilder) => ({
  getAccounts: builder.query<Account[], string>({
    providesTags: ["accounts"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapAccount) };
    },
  }),
});
