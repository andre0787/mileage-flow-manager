import { supabase, toQueryError } from "./shared";
import type { OwnersBuilder } from "./shared";

export const deleteOwnerEndpoint = (builder: OwnersBuilder) => ({
  deleteOwner: builder.mutation<null, string>({
    invalidatesTags: ["owners"],
    queryFn: async (id) => {
      const { error } = await supabase.from("owners").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});