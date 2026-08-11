import { baseApi } from "@/features/api/baseApi";
import { getAccountAlertsEndpoint } from "./getAccountAlerts";
import { addAccountAlertEndpoint } from "./addAccountAlert";
import { toggleAccountAlertEndpoint } from "./toggleAccountAlert";

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getAccountAlertsEndpoint(builder),
    ...addAccountAlertEndpoint(builder),
    ...toggleAccountAlertEndpoint(builder),
  }),
});