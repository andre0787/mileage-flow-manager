import {
  supabase,
  calcProportionalCost,
  calcAccountUpdate,
  generateRecurringEntries,
  mapEntry,
  parseDescription,
  serializeDescription,
  toQueryError,
} from "./shared";
import { toEntriesEntityState } from "./adapter";
import type { PointEntry, EntradasBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getEntriesEndpoint = (builder: EntradasBuilder) => ({
  getEntries: builder.query<EntityState<PointEntry, string>, string>({
    providesTags: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toEntriesEntityState((data ?? []).map(mapEntry)) };
    },
  }),
});
