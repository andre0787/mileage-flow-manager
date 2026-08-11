import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { baseApi } from "@/features/api/baseApi";
import { supabase } from "@/lib/supabase";
import type { AccountAlert } from "@/types";

export type AlertsBuilder = Parameters<
  NonNullable<Parameters<typeof baseApi.injectEndpoints>[0]["endpoints"]>
>[0];

export interface AlertRow {
  id: string;
  account_id: string;
  user_id: string;
  date: string;
  observation: string;
  read: boolean;
  created_at: string;
}

export type AddAccountAlertInput = {
  accountId: string;
  date: string;
  observation: string;
};

export type ToggleAccountAlertInput = { id: string; read: boolean };

export function toQueryError(err: { message: string }): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error: err.message };
}

export function mapAlert(row: AlertRow): AccountAlert {
  return {
    id: row.id,
    accountId: row.account_id,
    userId: row.user_id,
    date: row.date,
    observation: row.observation,
    read: row.read,
    createdAt: row.created_at,
  };
}

export { supabase };
export type { AccountAlert };