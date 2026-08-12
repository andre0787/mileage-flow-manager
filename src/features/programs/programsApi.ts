import { baseApi } from "@/features/api/baseApi";
import { getProgramsEndpoint } from "./getPrograms";
import { addProgramEndpoint } from "./addProgram";
import { updateProgramEndpoint } from "./updateProgram";
import { deleteProgramEndpoint } from "./deleteProgram";

export const programsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    ...getProgramsEndpoint(builder),
    ...addProgramEndpoint(builder),
    ...updateProgramEndpoint(builder),
    ...deleteProgramEndpoint(builder),
  }),
});
