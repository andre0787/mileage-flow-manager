import { supabase, toQueryError } from "./shared";
import type { AddAccountAlertInput, AlertsBuilder } from "./shared";

export const addAccountAlertEndpoint = (builder: AlertsBuilder) => ({
  addAccountAlert: builder.mutation<null, AddAccountAlertInput>({
    invalidatesTags: ["alerts"],
    queryFn: async (alert) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { error } = await supabase.from("account_alerts").insert({
        account_id: alert.accountId,
        user_id: user.id,
        date: alert.date,
        observation: alert.observation,
        read: false,
      });
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
