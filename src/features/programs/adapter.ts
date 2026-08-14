import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { Program } from "@/types";

export const {
  adapter: programsAdapter,
  toEntityState: toProgramsEntityState,
  selectAll: selectAllPrograms,
  selectById: selectByIdProgram,
  selectEntities: selectProgramEntities,
  selectIds: selectProgramIds,
} = createCollectionAdapter<Program>();
