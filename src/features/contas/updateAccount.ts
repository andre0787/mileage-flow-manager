import { supabase, buildAccountUpdate, toQueryError } from "./shared";
import type { AccountMutationInput, ContasBuilder } from "./shared";

export const updateAccountEndpoint = (builder: ContasBuilder) => ({
  updateAccount: builder.mutation<null, AccountMutationInput>({
    invalidatesTags: ["accounts"],
    queryFn: async ({ id, ...data }) => {
      const { error } = await supabase
        .from("accounts")
        .update(buildAccountUpdate(data))
        .eq("id", id);
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
