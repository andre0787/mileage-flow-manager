import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { AccountAlert } from "@/types";

export const {
  adapter: alertsAdapter,
  toEntityState: toAlertsEntityState,
  selectAll: selectAllAlerts,
  selectById: selectByIdAlert,
  selectEntities: selectAlertEntities,
  selectIds: selectAlertIds,
} = createCollectionAdapter<AccountAlert>();
