import { supabase, toQueryError } from "./shared";
import { mapClientCredit } from "@/hooks/useDatabase/mappers";
import type { ClientesBuilder } from "./shared";
import type { ClientCredit } from "@/types";

/** Ledger de crédito de TODOS os clientes (uma leitura p/ relatório de cobrança). */
export const getAllClientCreditsEndpoint = (builder: ClientesBuilder) => ({
  getAllClientCredits: builder.query<ClientCredit[], void>({
    providesTags: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credit_movements")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapClientCredit) };
    },
  }),
});

/** Extrato do ledger de crédito de um cliente (ordem cronológica). */
export const getClientCreditsEndpoint = (builder: ClientesBuilder) => ({
  getClientCredits: builder.query<ClientCredit[], string>({
    providesTags: ["clients"],
    queryFn: async (clientId) => {
      if (!clientId) return { data: [] };
      const { data, error } = await supabase
        .from("client_credit_movements")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });
      if (error) return { error: toQueryError(error) };
      return { data: (data ?? []).map(mapClientCredit) };
    },
  }),
});
