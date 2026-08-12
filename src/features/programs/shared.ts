import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import { mapProgram } from "@/hooks/useDatabase/mappers";
import type { Program } from "@/types";
import type { Database } from "@/lib/supabase-types";

export type ProgramUpdate = Database["public"]["Tables"]["programs"]["Update"];
export type ProgramMutationInput = Partial<Program> & { id: string };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export { supabase, mapProgram };
export type { Program };
export type ProgramsBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];
