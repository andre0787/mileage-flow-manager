import { supabase, toQueryError } from "./shared";
import type { Account, ContasBuilder } from "./shared";

export const addAccountEndpoint = (builder: ContasBuilder) => ({
  addAccount: builder.mutation<null, Account>({
    invalidatesTags: ["accounts"],
    queryFn: async (account) => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };
      const { error } = await supabase.from("accounts").insert({
        id: account.id,
        user_id: user.id,
        owner_id: account.ownerId,
        program_id: account.programId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        average_cost_per_mile: account.averageCostPerMile,
        total_invested: account.totalInvested,
        status: account.status,
        created_at: account.createdAt,
      });
      if (error) return { error: toQueryError(error) };
      return { data: null };
    },
  }),
});
