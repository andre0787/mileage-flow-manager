import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { Sale } from "@/types";

export const {
  adapter: salesAdapter,
  toEntityState: toSalesEntityState,
  selectAll: selectAllSales,
  selectById: selectByIdSale,
  selectEntities: selectSaleEntities,
  selectIds: selectSaleIds,
} = createCollectionAdapter<Sale>();
