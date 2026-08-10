import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { mapAccount } from "@/hooks/useDatabase/mappers";
import type { Account } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
export type AccountMutationInput = Partial<Account> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export function buildAccountUpdate(data: Partial<Account>): AccountUpdate {
  const updateData: AccountUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
  if (data.programId !== undefined) updateData.program_id = data.programId;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.balance !== undefined) updateData.balance = data.balance;
  if (data.averageCostPerMile !== undefined)
    updateData.average_cost_per_mile = data.averageCostPerMile;
  if (data.totalInvested !== undefined) updateData.total_invested = data.totalInvested;
  if (data.status !== undefined) updateData.status = data.status;
  return updateData;
}

export { baseApi, supabase, mapAccount };
export type { Account };
export type ContasBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];
