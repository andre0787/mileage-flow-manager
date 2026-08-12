import { supabase, toQueryError } from "./shared";
import type { OrigemTypeUpdate, OrigemTypeMutationInput, OrigemTypesBuilder } from "./shared";

export const updateOrigemTypeEndpoint = (builder: OrigemTypesBuilder) => ({
  updateOrigemType: builder.mutation<null, OrigemTypeMutationInput>({
    invalidatesTags: ["origem_types"],
    queryFn: async ({ id, ...data }) => {
      const updateData: OrigemTypeUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.accountType !== undefined) updateData.account_type = data.accountType;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.description !== undefined) updateData.description = data.description;

      const { error } = await supabase.from("origem_types").update(updateData).eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
