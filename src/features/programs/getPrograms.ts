import { supabase, mapProgram, toQueryError } from "./shared";
import type { Program, ProgramsBuilder } from "./shared";

export const getProgramsEndpoint = (builder: ProgramsBuilder) => ({
  getPrograms: builder.query<Program[], string>({
    providesTags: ["programs"],
    queryFn: async (userId) => {
      if (!userId) return { data: [] };
      const { data, error } = await supabase.from("programs").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapProgram) };
    },
  }),
});
