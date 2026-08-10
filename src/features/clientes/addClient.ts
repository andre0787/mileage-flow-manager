import { supabase, toQueryError } from "./shared";
import type { Client, ClientesBuilder } from "./shared";

export const addClientEndpoint = (builder: ClientesBuilder) => ({
  addClient: builder.mutation<null, Client>({
    invalidatesTags: ["clients"],
    queryFn: async (client) => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };
      const { error } = await supabase.from("clients").insert({
        id: client.id,
        user_id: user.id,
        name: client.name,
        cpf: client.cpf,
        email: client.email,
        phone: client.phone,
        telegram: client.telegram,
        total_purchases: client.totalPurchases,
        usage_history: client.usageHistory,
      });
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
