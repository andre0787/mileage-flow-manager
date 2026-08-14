import { createCollectionAdapter } from "@/lib/collectionAdapter";
import type { Account } from "@/types";

export const {
  adapter: accountsAdapter,
  toEntityState: toAccountsEntityState,
  selectAll: selectAllAccounts,
  selectById: selectByIdAccount,
  selectEntities: selectAccountEntities,
  selectIds: selectAccountIds,
} = createCollectionAdapter<Account>();
