import { supabase, toQueryError } from "./shared";
import type { AlertsBuilder, ToggleAccountAlertInput } from "./shared";

export const toggleAccountAlertEndpoint = (builder: AlertsBuilder) => ({
  toggleAccountAlert: builder.mutation<null, ToggleAccountAlertInput>({
    invalidatesTags: ["alerts"],
    queryFn: async ({ id, read }) => {
      const { error } = await supabase.from("account_alerts").update({ read }).eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
