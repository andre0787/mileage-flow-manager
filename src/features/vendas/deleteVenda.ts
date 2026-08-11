import { supabase, calcProportionalCost, calcAccountUpdate, toQueryError } from "./shared";
import type { VendasBuilder } from "./shared";

export const deleteVendaEndpoint = (builder: VendasBuilder) => ({
  deleteVenda: builder.mutation<null, string>({
    invalidatesTags: ["sales", "accounts"],
    queryFn: async (id) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) return { error: toQueryError(fetchError) };

      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) return { error: toQueryError(error) };

      if (sale.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", sale.account_id)
          .single();
        if (acc) {
          const milesToRestore = Number(sale.miles_used);
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);

          const investedToRestore =
            currentAvgCost > 0 && currentBalance > 0
              ? calcProportionalCost(milesToRestore, currentBalance, currentInvested)
              : Number(sale.cost_per_mile) * milesToRestore;

          const update = calcAccountUpdate(
            currentBalance,
            currentInvested,
            milesToRestore,
            investedToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }

      return { data: null };
    },
  }),
});
