import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { Owner } from "@/types";

export const {
  adapter: ownersAdapter,
  toEntityState: toOwnersEntityState,
  selectAll: selectAllOwners,
  selectById: selectByIdOwner,
  selectEntities: selectOwnerEntities,
  selectIds: selectOwnerIds,
} = createCollectionAdapter<Owner>();
