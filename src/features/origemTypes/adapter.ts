import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { OrigemType } from "@/types";

export const {
  adapter: origemTypesAdapter,
  toEntityState: toOrigemTypesEntityState,
  selectAll: selectAllOrigemTypes,
  selectById: selectByIdOrigemType,
  selectEntities: selectOrigemTypeEntities,
  selectIds: selectOrigemTypeIds,
} = createCollectionAdapter<OrigemType>();
