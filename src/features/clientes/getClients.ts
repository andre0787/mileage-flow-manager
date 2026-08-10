import { supabase, mapClient, toQueryError } from "./shared";
import type { Client, ClientesBuilder } from "./shared";

export const getClientsEndpoint = (builder: ClientesBuilder) => ({
  getClients: builder.query<Client[], string>({
    providesTags: ["clients"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("clients").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapClient) };
    },
  }),
});
