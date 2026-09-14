import { supabase, toQueryError } from "./shared";
import { isValidISODate, todayISODate } from "@/lib/dateUtils";
import type { ClientesBuilder } from "./shared";
import type { UpdateClientCreditDateInput } from "@/types";

/**
 * Edição da data de um adiantamento no extrato de Saldo.
 * Trava de escopo: só 'earn' com sale_id NULL (adiantamento manual).
 * Só created_at muda — valor/kind/venda do ledger nunca são tocados, então
 * o saldo continua derivado e a query (ordenada por created_at) reordena.
 */
export const updateClientCreditDateEndpoint = (builder: ClientesBuilder) => ({
  updateClientCreditDate: builder.mutation<{ id: string }, UpdateClientCreditDateInput>({
    invalidatesTags: ["clients"],
    queryFn: async ({ id, clientId, date }) => {
      if (!id) {
        return { error: toQueryError({ message: "Movimento não informado" }) };
      }
      if (!clientId) {
        return { error: toQueryError({ message: "Cliente não informado" }) };
      }
      if (!isValidISODate(date)) {
        return { error: toQueryError({ message: "Data inválida" }) };
      }
      if (date > todayISODate()) {
        return { error: toQueryError({ message: "Data não pode ser futura" }) };
      }
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { data: current, error: readError } = await supabase
        .from("client_credit_movements")
        .select("id,client_id,kind,sale_id")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (readError) return { error: toQueryError(readError) };
      if (!current || current.kind !== "earn" || current.sale_id !== null) {
        return { error: toQueryError({ message: "Só a data de adiantamentos pode ser editada" }) };
      }
      if (current.client_id !== clientId) {
        return { error: toQueryError({ message: "Movimento não pertence ao cliente" }) };
      }

      const { error } = await supabase
        .from("client_credit_movements")
        .update({ created_at: `${date}T12:00:00-03:00` })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return { error: toQueryError(error) };
      return { data: { id } };
    },
  }),
});
