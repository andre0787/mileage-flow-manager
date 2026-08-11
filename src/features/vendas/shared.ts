import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";
import { mapSale } from "@/hooks/useDatabase/mappers";
import type { Sale } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type VendaUpdate = Database["public"]["Tables"]["sales"]["Update"];
export type VendaMutationInput = Partial<Sale> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export {
  supabase,
  calcProportionalCost,
  calcAccountUpdate,
  mapSale,
};
export type { Sale };
export type VendasBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];