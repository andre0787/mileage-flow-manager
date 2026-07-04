import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { calcProportionalCost } from "@/lib/metrics";
import { calcAccountUpdate } from "@/lib/accounts";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";
import type { Database } from "@/lib/supabase-types";

function useUserId(): string | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

// ── Generic helpers ──

function mapOwner(row: Database["public"]["Tables"]["owners"]["Row"]): Owner {
  return { id: row.id, name: row.name, cpf: row.cpf ?? "", phone: row.phone ?? "" };
}

function mapProgram(row: Database["public"]["Tables"]["programs"]["Row"]): Program {
  return { id: row.id, name: row.name, type: row.type, maxPassengers: row.max_passengers, passengerCycleType: row.passenger_cycle_type, passengerCycleDays: row.passenger_cycle_days };
}

function mapOrigemType(row: Database["public"]["Tables"]["origem_types"]["Row"]): OrigemType {
  return { id: row.id, name: row.name, accountType: row.account_type, color: row.color };
}

function mapAccount(row: Database["public"]["Tables"]["accounts"]["Row"]): Account {
  return { id: row.id, name: row.name, ownerId: row.owner_id, programId: row.program_id, type: row.type, balance: Number(row.balance), averageCostPerMile: row.average_cost_per_mile != null ? Number(row.average_cost_per_mile) : undefined, totalInvested: row.total_invested != null ? Number(row.total_invested) : undefined, status: row.status, createdAt: row.created_at };
}

function mapEntry(row: Database["public"]["Tables"]["entries"]["Row"]): PointEntry {
  return { id: row.id, accountId: row.account_id, origemTypeId: row.origem_type_id, amount: Number(row.amount), amountPaid: Number(row.amount_paid), costPerThousand: Number(row.cost_per_thousand), date: row.date, conversionRate: row.conversion_rate, milesGenerated: row.miles_generated, costPerMile: row.cost_per_mile, sourceAccountId: row.source_account_id, bonusPercent: row.bonus_percent, description: row.description };
}

function mapClient(row: Database["public"]["Tables"]["clients"]["Row"]): Client {
  return { id: row.id, name: row.name, cpf: row.cpf, email: row.email, phone: row.phone ?? "", telegram: row.telegram, totalPurchases: row.total_purchases, usageHistory: row.usage_history ?? [] };
}

function mapSale(row: Database["public"]["Tables"]["sales"]["Row"]): Sale {
  return { id: row.id, accountId: row.account_id, accountName: row.account_name, ownerName: row.owner_name, program: row.program, clientId: row.client_id, clientName: row.client_name, milesUsed: Number(row.miles_used), saleValue: Number(row.sale_value), pricePerMile: row.price_per_mile, costPerMile: Number(row.cost_per_mile), additionalCost: row.additional_cost, additionalCostDesc: row.additional_cost_desc, profit: Number(row.profit), profitMargin: Number(row.profit_margin), status: row.status, ticketLocator: row.ticket_locator, passengers: row.passengers ?? [], date: row.date };
}

// ── Query hooks ──

export function useOwnersQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["owners", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("owners").select("*");
      if (error) throw error;
      return (data ?? []).map(mapOwner);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useProgramsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["programs", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*");
      if (error) throw error;
      return (data ?? []).map(mapProgram);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useOrigemTypesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["origem_types", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("origem_types").select("*");
      if (error) throw error;
      return (data ?? []).map(mapOrigemType);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useAccountsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["accounts", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return (data ?? []).map(mapAccount);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useEntriesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["entries", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select("*");
      if (error) throw error;
      return (data ?? []).map(mapEntry);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useClientsQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["clients", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*");
      if (error) throw error;
      return (data ?? []).map(mapClient);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useSalesQuery() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["sales", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("*");
      if (error) throw error;
      return (data ?? []).map(mapSale);
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

// ── Mutation hooks ──

export function useAddOwnerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (owner: Owner) => {
      const { error } = await supabase.from("owners").insert({
        id: owner.id, user_id: user!.id, name: owner.name, cpf: owner.cpf, phone: owner.phone,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useUpdateOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Owner> & { id: string }) => {
      const { error } = await supabase.from("owners").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useDeleteOwnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("owners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owners"] }),
  });
}

export function useAddProgramMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (program: Program) => {
      const { error } = await supabase.from("programs").insert({
        id: program.id, user_id: user!.id, name: program.name, type: program.type,
        max_passengers: program.maxPassengers, passenger_cycle_type: program.passengerCycleType, passenger_cycle_days: program.passengerCycleDays,
      });
      if (error) throw error;

      // Ensure a matching origem_type exists for pontos programs
      // (entries.origem_type_id FK references origem_types, but pontos entries
      // use the program ID as origem_type_id)
      if (program.type === "pontos") {
        const { error: otError } = await supabase.from("origem_types").upsert({
          id: program.id, user_id: user!.id, name: program.name, account_type: "pontos", color: "#3b82f6",
        }, { onConflict: "id" });
        if (otError) throw otError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["origem_types"] });
    },
  });
}

export function useUpdateProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Program> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.maxPassengers !== undefined) updateData.max_passengers = data.maxPassengers;
      if (data.passengerCycleType !== undefined) updateData.passenger_cycle_type = data.passengerCycleType;
      if (data.passengerCycleDays !== undefined) updateData.passenger_cycle_days = data.passengerCycleDays;
      const { error } = await supabase.from("programs").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useDeleteProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useAddOrigemTypeMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ot: OrigemType) => {
      const { error } = await supabase.from("origem_types").insert({
        id: ot.id, user_id: user!.id, name: ot.name, account_type: ot.accountType, color: ot.color,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["origem_types"] }),
  });
}

export function useUpdateOrigemTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<OrigemType> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.accountType !== undefined) updateData.account_type = data.accountType;
      if (data.color !== undefined) updateData.color = data.color;
      const { error } = await supabase.from("origem_types").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["origem_types"] }),
  });
}

export function useDeleteOrigemTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("origem_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["origem_types"] }),
  });
}

export function useAddAccountMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (account: Account) => {
      const { error } = await supabase.from("accounts").insert({
        id: account.id, user_id: user!.id, owner_id: account.ownerId, program_id: account.programId,
        name: account.name, type: account.type, balance: account.balance,
        average_cost_per_mile: account.averageCostPerMile, total_invested: account.totalInvested,
        status: account.status, created_at: account.createdAt,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.ownerId !== undefined) updateData.owner_id = data.ownerId;
      if (data.programId !== undefined) updateData.program_id = data.programId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.balance !== undefined) updateData.balance = data.balance;
      if (data.averageCostPerMile !== undefined) updateData.average_cost_per_mile = data.averageCostPerMile;
      if (data.totalInvested !== undefined) updateData.total_invested = data.totalInvested;
      if (data.status !== undefined) updateData.status = data.status;
      const { error } = await supabase.from("accounts").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useAddEntryMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry: PointEntry) => {
      const { error } = await supabase.from("entries").insert({
        id: entry.id, user_id: user!.id, account_id: entry.accountId, origem_type_id: entry.origemTypeId,
        amount: entry.amount, amount_paid: entry.amountPaid, cost_per_thousand: entry.costPerThousand,
        conversion_rate: entry.conversionRate, miles_generated: entry.milesGenerated,
        cost_per_mile: entry.costPerMile, source_account_id: entry.sourceAccountId,
        bonus_percent: entry.bonusPercent, date: entry.date, description: entry.description,
      });
      if (error) throw error;

      // Update source account if transfer
      if (entry.sourceAccountId) {
        const { data: source } = await supabase.from("accounts").select("balance, total_invested").eq("id", entry.sourceAccountId).single();
        if (source) {
          const srcBalance = Number(source.balance);
          const srcInvested = Number(source.total_invested ?? 0);
          const proportionalCost = calcProportionalCost(entry.amount, srcBalance, srcInvested);
          const update = calcAccountUpdate(srcBalance, srcInvested, -entry.amount, -proportionalCost);
          await supabase.from("accounts").update(update).eq("id", entry.sourceAccountId);
        }
      }

      // Update destination account
      const { data: dest } = await supabase.from("accounts").select("balance, total_invested").eq("id", entry.accountId).single();
      if (dest) {
        const amountToAdd = entry.milesGenerated ?? entry.amount;
        const update = calcAccountUpdate(Number(dest.balance), Number(dest.total_invested ?? 0), amountToAdd, entry.amountPaid);
        await supabase.from("accounts").update(update).eq("id", entry.accountId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldEntry, updates }: { oldEntry: PointEntry; updates: Partial<PointEntry> }) => {
      // 1. Reverse original account effects (same as delete)
      const { error: delErr } = await supabase.from("entries").delete().eq("id", oldEntry.id);
      if (delErr) throw delErr;

      const reverseDest = await supabase.from("accounts").select("balance, total_invested").eq("id", oldEntry.accountId).single();
      if (reverseDest.data) {
        const amountToRemove = oldEntry.milesGenerated ?? oldEntry.amount;
        const update = calcAccountUpdate(Number(reverseDest.data.balance), Number(reverseDest.data.total_invested ?? 0), -amountToRemove, -oldEntry.amountPaid);
        await supabase.from("accounts").update(update).eq("id", oldEntry.accountId);
      }

      if (oldEntry.sourceAccountId) {
        const reverseSrc = await supabase.from("accounts").select("balance, total_invested").eq("id", oldEntry.sourceAccountId).single();
        if (reverseSrc.data) {
          const update = calcAccountUpdate(Number(reverseSrc.data.balance), Number(reverseSrc.data.total_invested ?? 0), oldEntry.amount, oldEntry.amountPaid);
          await supabase.from("accounts").update(update).eq("id", oldEntry.sourceAccountId);
        }
      }

      // 2. Merge old + updates, insert as new entry
      const merged: PointEntry = { ...oldEntry, ...updates };
      const { error: insErr } = await supabase.from("entries").insert({
        id: merged.id, user_id: (await supabase.auth.getUser()).data.user!.id,
        account_id: merged.accountId, origem_type_id: merged.origemTypeId,
        amount: merged.amount, amount_paid: merged.amountPaid, cost_per_thousand: merged.costPerThousand,
        conversion_rate: merged.conversionRate, miles_generated: merged.milesGenerated,
        cost_per_mile: merged.costPerMile, source_account_id: merged.sourceAccountId,
        bonus_percent: merged.bonusPercent, date: merged.date, description: merged.description,
      });
      if (insErr) throw insErr;

      // 3. Apply new account effects (same as add)
      if (merged.sourceAccountId) {
        const srcRes = await supabase.from("accounts").select("balance, total_invested").eq("id", merged.sourceAccountId).single();
        if (srcRes.data) {
          const srcBalance = Number(srcRes.data.balance);
          const srcInvested = Number(srcRes.data.total_invested ?? 0);
          const proportionalCost = calcProportionalCost(merged.amount, srcBalance, srcInvested);
          const srcUpdate = calcAccountUpdate(srcBalance, srcInvested, -merged.amount, -proportionalCost);
          await supabase.from("accounts").update(srcUpdate).eq("id", merged.sourceAccountId);
        }
      }

      const destRes = await supabase.from("accounts").select("balance, total_invested").eq("id", merged.accountId).single();
      if (destRes.data) {
        const amountToAdd = merged.milesGenerated ?? merged.amount;
        const destUpdate = calcAccountUpdate(Number(destRes.data.balance), Number(destRes.data.total_invested ?? 0), amountToAdd, merged.amountPaid);
        await supabase.from("accounts").update(destUpdate).eq("id", merged.accountId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: PointEntry) => {
      const { error } = await supabase.from("entries").delete().eq("id", entry.id);
      if (error) throw error;

      // Reverse destination account update
      const { data: dest } = await supabase.from("accounts").select("balance, total_invested").eq("id", entry.accountId).single();
      if (dest) {
        const amountToRemove = entry.milesGenerated ?? entry.amount;
        const update = calcAccountUpdate(Number(dest.balance), Number(dest.total_invested ?? 0), -amountToRemove, -entry.amountPaid);
        await supabase.from("accounts").update(update).eq("id", entry.accountId);
      }

      // Reverse source account update if transfer
      if (entry.sourceAccountId) {
        const { data: source } = await supabase.from("accounts").select("balance, total_invested").eq("id", entry.sourceAccountId).single();
        if (source) {
          // costToRestore simplifies to entry.amountPaid (amount * (amountPaid / amount) = amountPaid)
          const update = calcAccountUpdate(Number(source.balance), Number(source.total_invested ?? 0), entry.amount, entry.amountPaid);
          await supabase.from("accounts").update(update).eq("id", entry.sourceAccountId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAddSaleMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sale: Sale) => {
      const { error } = await supabase.from("sales").insert({
        id: sale.id, user_id: user!.id, account_id: sale.accountId, account_name: sale.accountName,
        owner_name: sale.ownerName, program: sale.program, client_id: sale.clientId,
        client_name: sale.clientName, miles_used: sale.milesUsed, sale_value: sale.saleValue,
        price_per_mile: sale.pricePerMile, cost_per_mile: sale.costPerMile,
        additional_cost: sale.additionalCost, additional_cost_desc: sale.additionalCostDesc,
        profit: sale.profit, profit_margin: sale.profitMargin, status: sale.status,
        ticket_locator: sale.ticketLocator, passengers: sale.passengers, date: sale.date,
      });
      if (error) throw error;

      // Update account balance (deduct used miles)
      // Nota: totalInvested é atualizado separadamente em Vendas.tsx handleCreateSale
      // via updateAccountM.mutate. Pendente de centralizar futuramente.
      if (sale.accountId) {
        const { data: acc } = await supabase.from("accounts").select("balance").eq("id", sale.accountId).single();
        if (acc) {
          const newBalance = Math.max(0, Number(acc.balance) - sale.milesUsed);
          await supabase.from("accounts").update({ balance: newBalance }).eq("id", sale.accountId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Sale> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
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
      if (data.additionalCostDesc !== undefined) updateData.additional_cost_desc = data.additionalCostDesc;
      if (data.profit !== undefined) updateData.profit = data.profit;
      if (data.profitMargin !== undefined) updateData.profit_margin = data.profitMargin;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.ticketLocator !== undefined) updateData.ticket_locator = data.ticketLocator;
      if (data.passengers !== undefined) updateData.passengers = data.passengers;
      if (data.date !== undefined) updateData.date = data.date;
      const { error } = await supabase.from("sales").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });
}

export function useCancelSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sale, error: fetchError } = await supabase.from("sales").select("*").eq("id", id).single();
      if (fetchError || !sale) throw fetchError ?? new Error("Venda não encontrada");

      const { error: updateError } = await supabase.from("sales").update({ status: "cancelado" }).eq("id", id);
      if (updateError) throw updateError;

      if (sale.account_id) {
        const { data: acc } = await supabase.from("accounts").select("balance, total_invested").eq("id", sale.account_id).single();
        if (acc) {
          const miles = Number(sale.miles_used);
          const costToRestore = miles * Number(sale.cost_per_mile);
          const update = calcAccountUpdate(Number(acc.balance), Number(acc.total_invested ?? 0), miles, costToRestore);
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: sale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;

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

          const investedToRestore = currentAvgCost > 0 && currentBalance > 0
            ? calcProportionalCost(milesToRestore, currentBalance, currentInvested)
            : Number(sale.cost_per_mile) * milesToRestore;

          const update = calcAccountUpdate(currentBalance, currentInvested, milesToRestore, investedToRestore);
          await supabase.from("accounts").update(update).eq("id", sale.account_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useAddClientMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (client: Client) => {
      const { error } = await supabase.from("clients").insert({
        id: client.id, user_id: user!.id, name: client.name, cpf: client.cpf, email: client.email,
        phone: client.phone, telegram: client.telegram, total_purchases: client.totalPurchases,
        usage_history: client.usageHistory,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.cpf !== undefined) updateData.cpf = data.cpf;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.telegram !== undefined) updateData.telegram = data.telegram;
      if (data.totalPurchases !== undefined) updateData.total_purchases = data.totalPurchases;
      if (data.usageHistory !== undefined) updateData.usage_history = data.usageHistory;
      const { error } = await supabase.from("clients").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useClearAccountDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const tables = ["sales", "entries", "accounts", "clients", "owners", "programs", "origem_types"];
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().not("id", "is", null);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
