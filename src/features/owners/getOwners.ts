import { supabase, mapOwner, toQueryError } from "./shared";
import type { Owner, OwnersBuilder } from "./shared";

export const getOwnersEndpoint = (builder: OwnersBuilder) => ({
  getOwners: builder.query<Owner[], string>({
    providesTags: ["owners"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("owners").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapOwner) };
    },
  }),
});
