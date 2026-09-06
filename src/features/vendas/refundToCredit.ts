import { supabase, toQueryError } from "./shared";
import { recordStatusChange } from "./statusHistory";
import { logError } from "@/lib/logger";
import type { VendasBuilder } from "./shared";
import { planRefundToCredit, CREDIT_EPSILON } from "@/lib/clientCredits";
import type { RefundToCreditInput, RefundToCreditResult } from "@/types";

/**
 * Devolução de valor recebido para o crédito do cliente (espelho do recebimento).
 * Ordem anti-parcial sem DELETE (ledger append-only e sem policy de DELETE):
 * valida tudo (plano puro) → atualiza a venda → insere o earn; se a
 * inserção falhar, a venda volta via UPDATE (permitido) e o erro é propagado.
 */
export const refundToCreditEndpoint = (builder: VendasBuilder) => ({
  refundToCredit: builder.mutation<RefundToCreditResult, RefundToCreditInput>({
    invalidatesTags: ["sales", "accounts", "clients"],
    queryFn: async ({ saleId, amount }) => {
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
        return { error: toQueryError({ message: "Venda cancelada não pode devolver" }) };
      if (sale.status === "concluido")
        return {
          error: toQueryError({
            message: "Venda concluída não pode devolver — reabra a venda antes",
          }),
        };

      // 2. Plano puro (valida + limita tudo antes de escrever).
      const oldReceived = Number((sale as { amount_received?: unknown }).amount_received ?? 0);
      const plan = planRefundToCredit({
        saleValue: Number(sale.sale_value),
        amountReceived: oldReceived,
        amount,
      });
      if (plan.refunded <= CREDIT_EPSILON) {
        return { error: toQueryError({ message: "Informe um valor a devolver" }) };
      }

      // 3. Atualiza a venda primeiro (UPDATE condicional = compare-and-set:
      // se amount_received mudou desde a leitura, nada é atualizado e o
      // refund aborta em vez de devolver em duplicidade); 4. insere o earn.
      // Sem DELETE de compensação: em falha na inserção, a venda volta
      // via UPDATE (permitido) e o erro é propagado — ledger intacto.
      const { data: updated, error: updateError } = await supabase
        .from("sales")
        .update({
          amount_received: plan.newReceived,
          status: plan.backToPending ? "pendente" : sale.status,
        })
        .eq("id", saleId)
        .eq("amount_received", oldReceived)
        .select("id");
      if (updateError) return { error: toQueryError(updateError) };
      if (!updated || updated.length === 0) {
        return {
          error: toQueryError({
            message: "Venda alterada por outro processo, tente de novo",
          }),
        };
      }

      const { error: movementError } = await supabase.from("client_credit_movements").insert({
        user_id: user.id,
        client_id: sale.client_id,
        sale_id: saleId,
        kind: "earn",
        amount: plan.refunded,
      });
      if (movementError) {
        const { error: restoreError } = await supabase
          .from("sales")
          .update({ amount_received: oldReceived, status: sale.status })
          .eq("id", saleId);
        if (restoreError) {
          logError("refundToCredit:restore", restoreError);
          return {
            error: toQueryError({
              message:
                "Falha ao registrar devolução e ao restaurar a venda — verifique o extrato antes de tentar de novo",
            }),
          };
        }
        return { error: toQueryError(movementError) };
      }

      // F3: volta a pendente entra no histórico (best-effort).
      if (plan.backToPending) void recordStatusChange(user.id, saleId, sale.status, "pendente");

      return {
        data: {
          refunded: plan.refunded,
          newReceived: plan.newReceived,
          backToPending: plan.backToPending,
        },
      };
    },
  }),
});
