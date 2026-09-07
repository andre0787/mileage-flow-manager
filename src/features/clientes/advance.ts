import { supabase, toQueryError } from "./shared";
import { planAdvance } from "@/lib/clientCredits";
import type { ClientesBuilder } from "./shared";
import type { AddClientAdvanceInput } from "@/types";

/**
 * Adiantamento: dinheiro recebido do cliente ANTES de qualquer emissão.
 * Insere 'earn' sem venda no ledger append-only — o saldo continua derivado
 * (SUM earn − SUM spend) e o extrato mostra a nota descritiva.
 */
export const addClientAdvanceEndpoint = (builder: ClientesBuilder) => ({
  addClientAdvance: builder.mutation<{ amount: number }, AddClientAdvanceInput>({
    invalidatesTags: ["clients"],
    queryFn: async ({ clientId, amount, note }) => {
      if (!clientId) {
        return { error: toQueryError({ message: "Cliente não informado" }) };
      }
      const plan = planAdvance({ amount, note });
      if (!plan.ok) {
        return { error: toQueryError({ message: plan.error ?? "Valor inválido" }) };
      }
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { error } = await supabase.from("client_credit_movements").insert({
        user_id: user.id,
        client_id: clientId,
        sale_id: null,
        kind: "earn",
        amount: plan.amount ?? 0,
        note: plan.note ?? null,
      });
      if (error) return { error: toQueryError(error) };
      return { data: { amount: plan.amount ?? 0 } };
    },
  }),
});
