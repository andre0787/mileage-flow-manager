import { supabase, toQueryError } from "./shared";
import type { ContasBuilder } from "./shared";

export const deleteAccountEndpoint = (builder: ContasBuilder) => ({
  deleteAccount: builder.mutation<null, string>({
    invalidatesTags: ["accounts", "entries", "sales"],
    queryFn: async (id) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
