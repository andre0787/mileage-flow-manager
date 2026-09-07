import { baseApi } from "@/features/api/baseApi";
import { getClientsEndpoint } from "./getClients";
import { getAllClientCreditsEndpoint, getClientCreditsEndpoint } from "./credits";
import { addClientAdvanceEndpoint } from "./advance";
import { addClientEndpoint } from "./addClient";
import { updateClientEndpoint } from "./updateClient";
import { deleteClientEndpoint } from "./deleteClient";

export const clientesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getClientsEndpoint(builder),
    ...getAllClientCreditsEndpoint(builder),
    ...getClientCreditsEndpoint(builder),
    ...addClientAdvanceEndpoint(builder),
    ...addClientEndpoint(builder),
    ...updateClientEndpoint(builder),
    ...deleteClientEndpoint(builder),
  }),
});
