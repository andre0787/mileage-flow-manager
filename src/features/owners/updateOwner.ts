import { supabase, toQueryError } from "./shared";
import type { OwnerUpdate, OwnerMutationInput, OwnersBuilder } from "./shared";

export const updateOwnerEndpoint = (builder: OwnersBuilder) => ({
  updateOwner: builder.mutation<null, OwnerMutationInput>({
    invalidatesTags: ["owners"],
    queryFn: async ({ id, ...data }) => {
      const updateData: OwnerUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.cpf !== undefined) updateData.cpf = data.cpf;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.color !== undefined) updateData.color = data.color ?? null;

      const { error } = await supabase.from("owners").update(updateData).eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
