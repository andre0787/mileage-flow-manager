import { supabase, mapOwner, toQueryError } from "./shared";
import { toOwnersEntityState } from "./adapter";
import type { Owner, OwnersBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getOwnersEndpoint = (builder: OwnersBuilder) => ({
  getOwners: builder.query<EntityState<Owner, string>, string>({
    providesTags: ["owners"],
    queryFn: async (userId) => {
      if (!userId) return { data: toOwnersEntityState([]) };
      const { data, error } = await supabase.from("owners").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toOwnersEntityState((data ?? []).map(mapOwner)) };
    },
  }),
});
