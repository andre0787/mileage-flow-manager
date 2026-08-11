import { supabase, calcAccountUpdate, toQueryError } from "./shared";
import type { VendasBuilder } from "./shared";

export const cancelVendaEndpoint = (builder: VendasBuilder) => ({
  cancelVenda: builder.mutation<null, string>({
    invalidatesTags: ["sales", "accounts"],
    queryFn: async (id) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !sale)
        return { error: toQueryError(fetchError ?? { message: "Venda não encontrada" }) };

      const { error: updateError } = await supabase
        .from("sales")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (updateError) return { error: toQueryError(updateError) };

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