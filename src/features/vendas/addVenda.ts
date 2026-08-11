import { supabase, calcProportionalCost, calcAccountUpdate, toQueryError } from "./shared";
import type { Sale, VendasBuilder } from "./shared";

export const addVendaEndpoint = (builder: VendasBuilder) => ({
  addVenda: builder.mutation<null, Sale>({
    invalidatesTags: ["sales", "accounts"],
    queryFn: async (sale) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const { error } = await supabase.from("sales").insert({
        id: sale.id,
        user_id: user.id,
        account_id: sale.accountId,
        account_name: sale.accountName,
        owner_name: sale.ownerName,
        program: sale.program,
        client_id: sale.clientId,
        client_name: sale.clientName,
        miles_used: sale.milesUsed,
        sale_value: sale.saleValue,
        price_per_mile: sale.pricePerMile,
        cost_per_mile: sale.costPerMile,
        additional_cost: sale.additionalCost,
        additional_cost_desc: sale.additionalCostDesc,
        profit: sale.profit,
        profit_margin: sale.profitMargin,
        status: sale.status,
        ticket_locator: sale.ticketLocator,
        passengers: sale.passengers,
        date: sale.date,
      });
      if (error) return { error: toQueryError(error) };

      if (sale.accountId) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", sale.accountId)
          .single();
        if (acc) {
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);
          const proportionalInvested =
            currentAvgCost > 0
              ? currentAvgCost * sale.milesUsed
              : calcProportionalCost(sale.milesUsed, currentBalance, currentInvested);
          const update = calcAccountUpdate(
            currentBalance,
            currentInvested,
            -sale.milesUsed,
            -proportionalInvested,
          );
          await supabase.from("accounts").update(update).eq("id", sale.accountId);
        }
      }

      return { data: null };
    },
  }),
});