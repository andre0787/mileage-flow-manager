import { supabase, calcProportionalCost, calcAccountUpdate, toQueryError } from "./shared";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import type { Sale, VendasBuilder } from "./shared";

export const addVendaEndpoint = (builder: VendasBuilder) => ({
  addVenda: builder.mutation<null, Sale>({
    invalidatesTags: ["sales", "accounts"],
    queryFn: async (sale) => {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return { error: toQueryError({ message: "Usuário não autenticado" }) };

      const costs = Array.isArray(sale.additionalCosts) ? sale.additionalCosts : [];
      const sumCosts = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const additionalCost = costs.length > 0 ? sumCosts : (sale.additionalCost ?? undefined);
      const additionalCostDesc =
        costs.length > 0
          ? costs.map((c) => `${c.desc || "Custo"}: ${c.amount}`).join("; ")
          : sale.additionalCostDesc;
      const amountReceived = Math.min(
        Math.max(Number(sale.amountReceived ?? 0), 0),
        Number(sale.saleValue),
      );
      // Lucro recalculado server-side — ignora valores do client (anti-forgery).
      const serverProfit = calcProfit(
        Number(sale.saleValue),
        Number(sale.milesUsed),
        Number(sale.costPerMile ?? 0),
        sumCosts,
      );
      const serverProfitMargin = calcProfitMargin(serverProfit, Number(sale.saleValue));

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
        additional_cost: additionalCost,
        additional_cost_desc: additionalCostDesc,
        additional_costs: costs as unknown as never,
        amount_received: amountReceived as unknown as never,
        profit: serverProfit,
        profit_margin: serverProfitMargin,
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
