import { supabase, toQueryError } from "./shared";
import type { OrigemTypesBuilder } from "./shared";

export const deleteOrigemTypeEndpoint = (builder: OrigemTypesBuilder) => ({
  deleteOrigemType: builder.mutation<null, string>({
    invalidatesTags: ["origem_types"],
    queryFn: async (id) => {
      const { error } = await supabase.from("origem_types").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
