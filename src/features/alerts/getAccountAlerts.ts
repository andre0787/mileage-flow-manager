import { supabase, mapAlert, toQueryError } from "./shared";
import { toAlertsEntityState } from "./adapter";
import type { AccountAlert, AlertsBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getAccountAlertsEndpoint = (builder: AlertsBuilder) => ({
  getAccountAlerts: builder.query<EntityState<AccountAlert, string>, string>({
    providesTags: ["alerts"],
    queryFn: async (userId) => {
      if (!userId) return { data: toAlertsEntityState([]) };
      const { data, error } = await supabase
        .from("account_alerts")
        .select("*")
        .order("date", { ascending: false });
      if (error) return { error: toQueryError(error) };
      return { data: toAlertsEntityState((data ?? []).map(mapAlert)) };
    },
  }),
});
