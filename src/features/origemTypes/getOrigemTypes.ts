import { supabase, mapOrigemType, toQueryError } from "./shared";
import { toOrigemTypesEntityState } from "./adapter";
import type { OrigemType, OrigemTypesBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getOrigemTypesEndpoint = (builder: OrigemTypesBuilder) => ({
  getOrigemTypes: builder.query<EntityState<OrigemType, string>, string>({
    providesTags: ["origem_types"],
    queryFn: async (userId) => {
      if (!userId) return { data: toOrigemTypesEntityState([]) };
      const { data, error } = await supabase.from("origem_types").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toOrigemTypesEntityState((data ?? []).map(mapOrigemType)) };
    },
  }),
});
