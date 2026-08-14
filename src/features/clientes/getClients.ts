import { supabase, mapClient, toQueryError } from "./shared";
import { toClientsEntityState } from "./adapter";
import type { Client, ClientesBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getClientsEndpoint = (builder: ClientesBuilder) => ({
  getClients: builder.query<EntityState<Client, string>, string>({
    providesTags: ["clients"],
    queryFn: async (userId) => {
      if (!userId) return { data: toClientsEntityState([]) };
      const { data, error } = await supabase.from("clients").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toClientsEntityState((data ?? []).map(mapClient)) };
    },
  }),
});
