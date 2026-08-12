import { supabase, toQueryError } from "./shared";
import type { ProgramUpdate, ProgramMutationInput, ProgramsBuilder } from "./shared";

export const updateProgramEndpoint = (builder: ProgramsBuilder) => ({
  updateProgram: builder.mutation<null, ProgramMutationInput>({
    invalidatesTags: ["programs"],
    queryFn: async ({ id, ...data }) => {
      const updateData: ProgramUpdate = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.maxPassengers !== undefined) updateData.max_passengers = data.maxPassengers;
      if (data.passengerCycleType !== undefined)
        updateData.passenger_cycle_type = data.passengerCycleType;
      if (data.passengerCycleDays !== undefined)
        updateData.passenger_cycle_days = data.passengerCycleDays;

      const { error } = await supabase.from("programs").update(updateData).eq("id", id);
      if (error) return { error: toQueryError(error) };

      return { data: null };
    },
  }),
});
