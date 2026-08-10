import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { mapClient } from "@/hooks/useDatabase/mappers";
import type { Client } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ClientMutationInput = Partial<Client> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export function buildClientUpdate(data: Partial<Client>): ClientUpdate {
  const updateData: ClientUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.cpf !== undefined) updateData.cpf = data.cpf;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.telegram !== undefined) updateData.telegram = data.telegram;
  if (data.totalPurchases !== undefined) updateData.total_purchases = data.totalPurchases;
  if (data.usageHistory !== undefined) updateData.usage_history = data.usageHistory;
  return updateData;
}

export { baseApi, supabase, mapClient };
export type { Client };
export type ClientesBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];
