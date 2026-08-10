import { supabase, toQueryError } from "./shared";
import type { ClientesBuilder } from "./shared";

export const deleteClientEndpoint = (builder: ClientesBuilder) => ({
  deleteClient: builder.mutation<null, string>({
    invalidatesTags: ["clients", "sales"],
    queryFn: async (id) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
