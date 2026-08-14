import { supabase, mapSale, toQueryError } from "./shared";
import { toSalesEntityState } from "./adapter";
import type { Sale, VendasBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getVendasEndpoint = (builder: VendasBuilder) => ({
  getVendas: builder.query<EntityState<Sale, string>, string>({
    providesTags: ["sales"],
    queryFn: async (userId) => {
      if (!userId) return { data: toSalesEntityState([]) };
      const { data, error } = await supabase.from("sales").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toSalesEntityState((data ?? []).map(mapSale)) };
    },
  }),
});
