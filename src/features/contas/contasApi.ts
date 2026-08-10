import { baseApi } from "@/features/api/baseApi";
import { getAccountsEndpoint } from "./getAccounts";
import { addAccountEndpoint } from "./addAccount";
import { updateAccountEndpoint } from "./updateAccount";
import { deleteAccountEndpoint } from "./deleteAccount";
import { recalcAccountEndpoint } from "./recalcAccount";

export const contasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getAccountsEndpoint(builder),
    ...addAccountEndpoint(builder),
    ...updateAccountEndpoint(builder),
    ...deleteAccountEndpoint(builder),
    ...recalcAccountEndpoint(builder),
  }),
});
