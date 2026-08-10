import { baseApi } from "@/features/api/baseApi";
import { getClientsEndpoint } from "./getClients";
import { addClientEndpoint } from "./addClient";
import { updateClientEndpoint } from "./updateClient";
import { deleteClientEndpoint } from "./deleteClient";

export const clientesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getClientsEndpoint(builder),
    ...addClientEndpoint(builder),
    ...updateClientEndpoint(builder),
    ...deleteClientEndpoint(builder),
  }),
});
