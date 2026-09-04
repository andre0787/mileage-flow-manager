import { supabase, calcProportionalCost, calcAccountUpdate, toQueryError } from "./shared";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import type { Sale, VendaUpdate, VendaMutationInput, VendasBuilder } from "./shared";

export const updateVendaEndpoint = (builder: VendasBuilder) => ({
  updateVenda: builder.mutation<null, VendaMutationInput>({
    invalidatesTags: ["sales", "accounts"],
    queryFn: async ({ id, ...data }) => {
      // 1. Fetch current sale from DB for old values
      const { data: oldSale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError || !oldSale)
        return { error: toQueryError(fetchError ?? { message: "Venda não encontrada" }) };

      // 2. Build update data (snake_case)
      const updateData: VendaUpdate = {};
      if (data.accountId !== undefined) updateData.account_id = data.accountId;
      if (data.accountName !== undefined) updateData.account_name = data.accountName;
      if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
      if (data.program !== undefined) updateData.program = data.program;
      if (data.clientId !== undefined) updateData.client_id = data.clientId;
      if (data.clientName !== undefined) updateData.client_name = data.clientName;
      if (data.milesUsed !== undefined) updateData.miles_used = data.milesUsed;
      if (data.saleValue !== undefined) updateData.sale_value = data.saleValue;
      if (data.pricePerMile !== undefined) updateData.price_per_mile = data.pricePerMile;
      if (data.costPerMile !== undefined) updateData.cost_per_mile = data.costPerMile;
      if (data.additionalCost !== undefined) updateData.additional_cost = data.additionalCost;
      if (data.additionalCostDesc !== undefined)
        updateData.additional_cost_desc = data.additionalCostDesc;
      if (data.additionalCosts !== undefined) {
        const costs = Array.isArray(data.additionalCosts) ? data.additionalCosts : [];
        const sum = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
        (updateData as Record<string, unknown>).additional_costs = costs;
        updateData.additional_cost = sum;
        updateData.additional_cost_desc = costs.map((c) => `${c.desc || "Custo"}: ${c.amount}`).join("; ");
      }
      const effectiveSaleValue = data.saleValue ?? Number(oldSale.sale_value);
      if (data.amountReceived !== undefined) {
        (updateData as Record<string, unknown>).amount_received = Math.min(
          Math.max(Number(data.amountReceived ?? 0), 0),
          effectiveSaleValue,
        );
      } else if (data.saleValue !== undefined) {
        const oldReceived = Number(
          (oldSale as { amount_received?: unknown }).amount_received ?? 0,
        );
        (updateData as Record<string, unknown>).amount_received = Math.min(
          Math.max(oldReceived, 0),
          effectiveSaleValue,
        );
      }
      // Lucro recalculado server-side — ignora valores do client (anti-forgery).
      const effMiles = data.milesUsed ?? Number(oldSale.miles_used);
      const effCostPerMile = data.costPerMile ?? Number(oldSale.cost_per_mile);
      const oldCostsRaw = (oldSale as { additional_costs?: unknown }).additional_costs;
      const oldCostsSum = Array.isArray(oldCostsRaw)
        ? oldCostsRaw.reduce((s: number, c: unknown) => s + (Number((c as { amount?: unknown }).amount ?? 0) || 0), 0)
        : Number(oldSale.additional_cost ?? 0);
      const effCostsSum =
        data.additionalCosts !== undefined
          ? (Array.isArray(data.additionalCosts) ? data.additionalCosts : []).reduce(
              (s, c) => s + (Number(c.amount) || 0),
              0,
            )
          : (data.additionalCost ?? oldCostsSum);
      const serverProfit = calcProfit(
        Number(effectiveSaleValue),
        Number(effMiles),
        Number(effCostPerMile),
        Number(effCostsSum),
      );
      updateData.profit = serverProfit;
      updateData.profit_margin = calcProfitMargin(serverProfit, Number(effectiveSaleValue));
      if (data.status !== undefined) updateData.status = data.status as VendaUpdate["status"];
      if (data.ticketLocator !== undefined) updateData.ticket_locator = data.ticketLocator;
      if (data.passengers !== undefined) updateData.passengers = data.passengers;
      if (data.date !== undefined) updateData.date = data.date;

      // 3. Compute old vs new
      const oldMiles = Number(oldSale.miles_used);
      const newMiles = data.milesUsed ?? oldMiles;
      const oldAccountId = oldSale.account_id;
      const newAccountId = data.accountId ?? oldAccountId;
      const oldWasCanceled = oldSale.status === "cancelado";
      const newIsCanceled = (data.status ?? oldSale.status) === "cancelado";

      // 4. Reverse old impact on account (add back miles + cost)
      //    Skip if old sale was canceled (already reversed)
      if (oldAccountId && oldMiles > 0 && !oldWasCanceled) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", oldAccountId)
          .single();
        if (acc) {
          const avgCost = Number(acc.average_cost_per_mile ?? 0);
          const costToRestore =
            avgCost > 0 ? avgCost * oldMiles : Number(oldSale.cost_per_mile) * oldMiles;
          const update = calcAccountUpdate(
            Number(acc.balance),
            Number(acc.total_invested ?? 0),
            oldMiles,
            costToRestore,
          );
          await supabase.from("accounts").update(update).eq("id", oldAccountId);
        }
      }

      // 5. Update sale record
      const { error } = await supabase.from("sales").update(updateData).eq("id", id);
      if (error) return { error: toQueryError(error) };

      // 6. Apply new impact on account (deduct miles + cost)
      if (newAccountId && newMiles > 0 && !newIsCanceled) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance, total_invested, average_cost_per_mile")
          .eq("id", newAccountId)
          .single();
        if (acc) {
          const currentBalance = Number(acc.balance);
          const currentInvested = Number(acc.total_invested ?? 0);
          const currentAvgCost = Number(acc.average_cost_per_mile ?? 0);
          const proportionalInvested =
            currentAvgCost > 0
              ? currentAvgCost * newMiles
              : calcProportionalCost(newMiles, currentBalance, currentInvested);
          const update = calcAccountUpdate(
            currentBalance,
            currentInvested,
            -newMiles,
            -proportionalInvested,
          );
          await supabase.from("accounts").update(update).eq("id", newAccountId);
        }
      }

      return { data: null };
    },
  }),
});
