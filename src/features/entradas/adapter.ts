import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { PointEntry } from "@/types";

export const {
  adapter: entriesAdapter,
  toEntityState: toEntriesEntityState,
  selectAll: selectAllEntries,
  selectById: selectByIdEntry,
  selectEntities: selectEntryEntities,
  selectIds: selectEntryIds,
} = createCollectionAdapter<PointEntry>();
