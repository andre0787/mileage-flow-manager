import { supabase, calcAccountUpdate, toQueryError } from "./shared";
import { mapClientCredit } from "@/hooks/useDatabase/mappers";
import { planCancelReversals } from "@/lib/clientCredits";
import type { VendasBuilder } from "./shared";

export const cancelVendaEndpoint = (builder: VendasBuilder) => ({
  cancelVenda: builder.mutation<null, string>({
    invalidatesTags: ["sales", "accounts", "clients"],
    queryFn: async (id) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !sale)
        return { error: toQueryError(fetchError ?? { message: "Venda não encontrada" }) };

      // 2. Cancela a venda primeiro; 3. estorna o crédito depois.
      // Ordem anti-parcial sem DELETE (ledger é append-only e não há policy
      // de DELETE): se o estorno falhar, a venda volta ao status anterior
      // via UPDATE (permitido) e o erro é propagado.
      const { data: creditMoves, error: creditFetchError } = await supabase
        .from("client_credit_movements")
        .select("*")
        .eq("sale_id", id);
      if (creditFetchError) return { error: toQueryError(creditFetchError) };
      const reversals = planCancelReversals((creditMoves ?? []).map(mapClientCredit));

      const oldStatus = sale.status;
      const { error: cancelError } = await supabase
        .from("sales")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (cancelError) return { error: toQueryError(cancelError) };

      try {
        for (const r of reversals) {
          const { error } = await supabase.from("client_credit_movements").insert({
            user_id: sale.user_id,
            client_id: sale.client_id,
            sale_id: id,
            kind: "reversal",
            reversal_of: r.reversalOf,
            amount: r.amount,
          });
          if (error) throw new Error(error.message);
        }
      } catch (err) {
        await supabase.from("sales").update({ status: oldStatus }).eq("id", id);
        return {
          error: toQueryError(
            err instanceof Error ? err : { message: "Falha ao estornar crédito" },
          ),
        };
      }

      if (sale.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested")
          .eq("id", sale.account_id)
          .single();
        if (acc) {
          const miles = Number(sale.miles_used);
          const costToRestore = miles * Number(sale.cost_per_mile);
          const update = calcAccountUpdate(
            Number(acc.balance),
            Number(acc.total_invested ?? 0),
            miles,
            costToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }

      return { data: null };
    },
  }),
});
