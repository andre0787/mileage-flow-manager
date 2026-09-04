import { supabase, toQueryError } from "./shared";
import type { VendasBuilder } from "./shared";
import { mapClientCredit } from "@/hooks/useDatabase/mappers";
import { planReceipt, calcCreditBalance, CREDIT_EPSILON } from "@/lib/clientCredits";
import type { ReceiveWithCreditInput, ReceiveWithCreditResult } from "@/types";

/**
 * Recebimento com crédito em mutation lógica única (spec §4).
 * Ordem anti-parcial sem DELETE (ledger append-only e sem policy de DELETE):
 * valida tudo (plano puro) → atualiza a venda → insere movimentos; se a
 * inserção falhar, a venda volta via UPDATE (permitido) e o erro é propagado.
 */
export const receiveVendaEndpoint = (builder: VendasBuilder) => ({
  receiveWithCredit: builder.mutation<ReceiveWithCreditResult, ReceiveWithCreditInput>({
    invalidatesTags: ["sales", "accounts", "clients"],
    queryFn: async ({ saleId, cash, useCredit }) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      // 1. Venda atual (valores antigos para o plano).
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", saleId)
        .single();
      if (fetchError || !sale)
        return { error: toQueryError(fetchError ?? { message: "Venda não encontrada" }) };
      if (sale.status === "cancelado")
        return { error: toQueryError({ message: "Venda cancelada não pode receber" }) };

      // 2. Saldo de crédito do cliente (derivado do ledger).
      const { data: moves, error: movesError } = await supabase
        .from("client_credit_movements")
        .select("*")
        .eq("client_id", sale.client_id);
      if (movesError) return { error: toQueryError(movesError) };
      const balance = calcCreditBalance((moves ?? []).map(mapClientCredit));

      // 3. Plano puro (valida + limita tudo antes de escrever).
      const oldReceived = Number((sale as { amount_received?: unknown }).amount_received ?? 0);
      const plan = planReceipt({
        saleValue: Number(sale.sale_value),
        amountReceived: oldReceived,
        balance,
        cash,
        useCredit,
      });
      if (
        plan.appliedCash <= CREDIT_EPSILON &&
        plan.appliedCredit <= CREDIT_EPSILON &&
        plan.earnedCredit <= CREDIT_EPSILON
      ) {
        return { error: toQueryError({ message: "Informe um valor a receber" }) };
      }

      // 4. Atualiza a venda primeiro; 5. insere os movimentos depois.
      // Sem DELETE de compensação: em falha na inserção, a venda volta
      // via UPDATE (permitido) e o erro é propagado — ledger intacto.
      const { error: updateError } = await supabase
        .from("sales")
        .update({
          amount_received: plan.newReceived,
          status: plan.fullyPaid ? "pago" : sale.status,
        })
        .eq("id", saleId);
      if (updateError) return { error: toQueryError(updateError) };

      const creditRows: {
        user_id: string;
        client_id: string;
        sale_id: string;
        kind: "earn" | "spend";
        amount: number;
      }[] = [];
      if (plan.appliedCredit > CREDIT_EPSILON)
        creditRows.push({
          user_id: user.id,
          client_id: sale.client_id,
          sale_id: saleId,
          kind: "spend",
          amount: plan.appliedCredit,
        });
      if (plan.earnedCredit > CREDIT_EPSILON)
        creditRows.push({
          user_id: user.id,
          client_id: sale.client_id,
          sale_id: saleId,
          kind: "earn",
          amount: plan.earnedCredit,
        });
      if (creditRows.length > 0) {
        const { error: movementError } = await supabase
          .from("client_credit_movements")
          .insert(creditRows);
        if (movementError) {
          await supabase
            .from("sales")
            .update({ amount_received: oldReceived, status: sale.status })
            .eq("id", saleId);
          return { error: toQueryError(movementError) };
        }
      }

      return {
        data: {
          appliedCash: plan.appliedCash,
          appliedCredit: plan.appliedCredit,
          earnedCredit: plan.earnedCredit,
          newReceived: plan.newReceived,
          fullyPaid: plan.fullyPaid,
        },
      };
    },
  }),
});
