import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { mapOrigemType } from "@/hooks/useDatabase/mappers";
import type { OrigemType } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type OrigemTypeInsert = Database["public"]["Tables"]["origem_types"]["Insert"];
export type OrigemTypeUpdate = Database["public"]["Tables"]["origem_types"]["Update"];
export type OrigemTypeMutationInput = Partial<OrigemType> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export { supabase, mapOrigemType };
export type { OrigemType };
export type OrigemTypesBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];
