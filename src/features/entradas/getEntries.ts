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
import type { PointEntry, EntradasBuilder } from "./shared";

export const getEntriesEndpoint = (builder: EntradasBuilder) => ({
  getEntries: builder.query<PointEntry[], string>({
    providesTags: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapEntry) };
    },
  }),
});
