import { supabase, buildClientUpdate, toQueryError } from "./shared";
import type { ClientMutationInput, ClientesBuilder } from "./shared";

export const updateClientEndpoint = (builder: ClientesBuilder) => ({
  updateClient: builder.mutation<null, ClientMutationInput>({
    invalidatesTags: ["clients"],
    queryFn: async ({ id, ...data }) => {
      const { error } = await supabase.from("clients").update(buildClientUpdate(data)).eq("id", id);
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
