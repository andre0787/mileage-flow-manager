import { supabase, mapProgram, toQueryError } from "./shared";
import { toProgramsEntityState } from "./adapter";
import type { Program, ProgramsBuilder } from "./shared";
import type { EntityState } from "@reduxjs/toolkit";

export const getProgramsEndpoint = (builder: ProgramsBuilder) => ({
  getPrograms: builder.query<EntityState<Program, string>, string>({
    providesTags: ["programs"],
    queryFn: async (userId) => {
      if (!userId) return { data: toProgramsEntityState([]) };
      const { data, error } = await supabase.from("programs").select("*");
      if (error) return { error: toQueryError(error) };
      return { data: toProgramsEntityState((data ?? []).map(mapProgram)) };
    },
  }),
});
