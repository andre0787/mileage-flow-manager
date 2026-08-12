import { supabase, toQueryError } from "./shared";
import type { ProgramsBuilder } from "./shared";

export const deleteProgramEndpoint = (builder: ProgramsBuilder) => ({
  deleteProgram: builder.mutation<null, string>({
    invalidatesTags: ["programs"],
    queryFn: async (id) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
