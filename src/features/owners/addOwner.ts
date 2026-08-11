import { supabase, toQueryError } from "./shared";
import type { Owner, OwnersBuilder } from "./shared";

export const addOwnerEndpoint = (builder: OwnersBuilder) => ({
  addOwner: builder.mutation<null, Owner>({
    invalidatesTags: ["owners"],
    queryFn: async (owner) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { error } = await supabase.from("owners").insert({
        id: owner.id,
        user_id: user.id,
        name: owner.name,
        cpf: owner.cpf,
        phone: owner.phone,
      });
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});