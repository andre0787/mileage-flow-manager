import { supabase, mapSale, toQueryError } from "./shared";
import type { Sale, VendasBuilder } from "./shared";

export const getVendasEndpoint = (builder: VendasBuilder) => ({
  getVendas: builder.query<Sale[], string>({
    providesTags: ["sales"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("sales").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapSale) };
    },
  }),
});
