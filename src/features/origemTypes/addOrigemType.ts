import { supabase, toQueryError } from "./shared";
import type { OrigemType, OrigemTypeInsert, OrigemTypesBuilder } from "./shared";

export const addOrigemTypeEndpoint = (builder: OrigemTypesBuilder) => ({
  addOrigemType: builder.mutation<null, OrigemType>({
    invalidatesTags: ["origem_types"],
    queryFn: async (ot) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const data: OrigemTypeInsert = {
        id: ot.id,
        user_id: user.id,
        name: ot.name,
        account_type: ot.accountType,
        color: ot.color,
      };
      // ponytail: description column added by migration; only include if defined so it works pre-migration
      if (ot.description !== undefined) data.description = ot.description;

      const { error } = await supabase.from("origem_types").insert(data);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
