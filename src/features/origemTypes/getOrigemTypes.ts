import { supabase, mapOrigemType, toQueryError } from "./shared";
import type { OrigemType, OrigemTypesBuilder } from "./shared";

export const getOrigemTypesEndpoint = (builder: OrigemTypesBuilder) => ({
  getOrigemTypes: builder.query<OrigemType[], string>({
    providesTags: ["origem_types"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("origem_types").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapOrigemType) };
    },
  }),
});
