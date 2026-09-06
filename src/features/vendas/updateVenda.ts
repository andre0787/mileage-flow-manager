import { supabase, calcProportionalCost, calcAccountUpdate, toQueryError } from "./shared";
import { validateEffectiveKind } from "@/lib/saleKind";
import { buildVendaUpdate } from "./buildVendaUpdate";
import type { Sale, VendaMutationInput, VendasBuilder } from "./shared";

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

      // Tipo da venda é imutável: a troca milhas↔servico exigiria
      // restaurar/aplicar estoque (fora do escopo).
      const oldKind = (oldSale as { sale_kind?: unknown }).sale_kind ?? "milhas";
      if (data.kind !== undefined && data.kind !== oldKind)
        return { error: toQueryError({ message: "Tipo da venda não pode ser alterado." }) };

      // Revalida o estado EFETIVO (banco + patch) — mesma regra do addVenda.
      const kindEffErrors = validateEffectiveKind(oldSale, data);
      if (kindEffErrors.length > 0) return { error: toQueryError({ message: kindEffErrors[0] }) };

      // 2. Payload snake_case + lucro server-side (extraído p/ rule-41).
      const updateData = buildVendaUpdate(oldSale, data);

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
