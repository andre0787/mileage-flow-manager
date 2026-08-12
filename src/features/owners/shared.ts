import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { mapOwner } from "@/hooks/useDatabase/mappers";
import type { Owner } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type OwnerUpdate = Database["public"]["Tables"]["owners"]["Update"];
export type OwnerMutationInput = Partial<Owner> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export { supabase, mapOwner };
export type { Owner };
export type OwnersBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];
