import { supabase, toQueryError } from "./shared";
import type { Program, ProgramsBuilder } from "./shared";

export const addProgramEndpoint = (builder: ProgramsBuilder) => ({
  addProgram: builder.mutation<null, Program>({
    invalidatesTags: ["programs", "origem_types"],
    queryFn: async (program) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { error } = await supabase.from("programs").insert({
        id: program.id,
        user_id: user.id,
        name: program.name,
        type: program.type,
        max_passengers: program.maxPassengers,
        passenger_cycle_type: program.passengerCycleType,
        passenger_cycle_days: program.passengerCycleDays,
      });
      if (error) return { error: toQueryError(error) };

      if (program.type === "pontos") {
        const { error: otError } = await supabase
          .from("origem_types")
          .upsert(
            {
              id: program.id,
              user_id: user.id,
              name: program.name,
              account_type: "pontos",
              color: "#3b82f6",
            },
            { onConflict: "id" },
          );
        if (otError) return { error: toQueryError(otError) };
      }

      return { data: null };
    },
  }),
});
