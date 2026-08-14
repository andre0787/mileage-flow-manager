import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { Client } from "@/types";

export const {
  adapter: clientsAdapter,
  toEntityState: toClientsEntityState,
  selectAll: selectAllClients,
  selectById: selectByIdClient,
  selectEntities: selectClientEntities,
  selectIds: selectClientIds,
} = createCollectionAdapter<Client>();
