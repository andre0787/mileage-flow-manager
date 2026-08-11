import { supabase, mapAlert, toQueryError } from "./shared";
import type { AccountAlert, AlertsBuilder } from "./shared";

export const getAccountAlertsEndpoint = (builder: AlertsBuilder) => ({
  getAccountAlerts: builder.query<AccountAlert[], string>({
    providesTags: ["alerts"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase
        .from("account_alerts")
        .select("*")
        .order("date", { ascending: false });
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapAlert) };
    },
  }),
});