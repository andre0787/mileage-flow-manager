import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnersQuery, useProgramsQuery, useOrigemTypesQuery, useAccountsQuery, useEntriesQuery, useClientsQuery, useSalesQuery } from "@/hooks/useDatabase";
import { useAddOwnerMutation, useUpdateOwnerMutation, useDeleteOwnerMutation } from "@/hooks/useDatabase";
import { useAddProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation } from "@/hooks/useDatabase";
import { useAddOrigemTypeMutation, useUpdateOrigemTypeMutation, useDeleteOrigemTypeMutation } from "@/hooks/useDatabase";
import { useAddAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from "@/hooks/useDatabase";
import { useAddEntryMutation, useDeleteEntryMutation } from "@/hooks/useDatabase";
import { useAddSaleMutation, useUpdateSaleMutation, useDeleteSaleMutation } from "@/hooks/useDatabase";
import { useAddClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "@/hooks/useDatabase";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";

export const TRANSFERENCIA_ID = "builtin-transferencia";
const STORAGE_PREFIX = "mc-";

interface DataContextType {
  owners: Owner[]
  programs: Program[]
  origemTypes: OrigemType[]
  accounts: Account[]
  entries: PointEntry[]
  sales: Sale[]
  clients: Client[]

  addOwner: (data: Omit<Owner, "id">) => void
  updateOwner: (id: string, data: Partial<Owner>) => void
  deleteOwner: (id: string) => void

  addProgram: (data: Omit<Program, "id">) => void
  updateProgram: (id: string, data: Partial<Program>) => void
  deleteProgram: (id: string) => void

  addOrigemType: (data: Omit<OrigemType, "id">, id?: string) => void
  updateOrigemType: (id: string, data: Partial<OrigemType>) => void
  deleteOrigemType: (id: string) => void

  addAccount: (data: Omit<Account, "id" | "createdAt">) => void
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void

  addEntry: (data: Omit<PointEntry, "id">) => void
  deleteEntry: (id: string) => void

  addSale: (data: Omit<Sale, "id">) => void
  updateSale: (id: string, data: Partial<Sale>) => void
  deleteSale: (id: string) => void

  addClient: (data: Omit<Client, "id">, id?: string) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: owners = [] } = useOwnersQuery();
  const { data: programs = [] } = useProgramsQuery();
  const { data: origemTypes = [] } = useOrigemTypesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: entries = [] } = useEntriesQuery();
  const { data: clients = [] } = useClientsQuery();
  const { data: sales = [] } = useSalesQuery();

  // Ensure built-in TRANSFERENCIA type exists
  useEffect(() => {
    if (!user) return;
    const hasBuiltin = origemTypes.some((ot) => ot.id === TRANSFERENCIA_ID);
    if (!hasBuiltin) {
      supabase.from("origem_types").upsert({
        id: TRANSFERENCIA_ID,
        user_id: user.id,
        name: "Transferência",
        account_type: "milhas",
        color: "#8b5cf6",
      }, { onConflict: "id" }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["origem_types"] });
      });
    }
  }, [user, origemTypes]);

  // Migrate localStorage data to Supabase on first login
  useEffect(() => {
    if (!user) return;
    const migratedKey = STORAGE_PREFIX + "migrated";
    if (localStorage.getItem(migratedKey)) return;

    const migrate = async () => {
      const data = loadStorageData();
      if (!data) return;
      localStorage.setItem(migratedKey, "true");

      const userId = user.id;

      // Migrate owners
      if (data.owners?.length) {
        const { error } = await supabase.from("owners").upsert(
          data.owners.map((o: Owner) => ({ ...o, user_id: userId })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration owners:", error.message);
      }

      // Migrate programs
      if (data.programs?.length) {
        const { error } = await supabase.from("programs").upsert(
          data.programs.map((p: Program) => ({
            id: p.id, user_id: userId, name: p.name, type: p.type,
            max_passengers: p.maxPassengers, passenger_cycle_type: p.passengerCycleType,
            passenger_cycle_days: p.passengerCycleDays,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration programs:", error.message);

        // Create matching origem_types for pontos programs
        const pontosPrograms = (data.programs as Program[]).filter((p) => p.type === "pontos");
        if (pontosPrograms.length) {
          const { error: otErr } = await supabase.from("origem_types").upsert(
            pontosPrograms.map((p) => ({
              id: p.id, user_id: userId, name: p.name, account_type: "pontos", color: "#3b82f6",
            })),
            { onConflict: "id" }
          );
          if (otErr) console.warn("Migration pontos origem_types:", otErr.message);
        }
      }

      // Migrate origem types
      if (data.origemTypes?.length) {
        const { error } = await supabase.from("origem_types").upsert(
          data.origemTypes.map((ot: OrigemType) => ({
            id: ot.id, user_id: userId, name: ot.name, account_type: ot.accountType, color: ot.color,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration origemTypes:", error.message);
      }

      // Migrate accounts
      if (data.accounts?.length) {
        const { error } = await supabase.from("accounts").upsert(
          data.accounts.map((a: Account) => ({
            id: a.id, user_id: userId, owner_id: a.ownerId, program_id: a.programId,
            name: a.name, type: a.type, balance: a.balance,
            average_cost_per_mile: a.averageCostPerMile, total_invested: a.totalInvested,
            status: a.status, created_at: a.createdAt,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration accounts:", error.message);
      }

      // Migrate entries
      if (data.entries?.length) {
        const { error } = await supabase.from("entries").upsert(
          data.entries.map((e: PointEntry) => ({
            id: e.id, user_id: userId, account_id: e.accountId, origem_type_id: e.origemTypeId,
            amount: e.amount, amount_paid: e.amountPaid, cost_per_thousand: e.costPerThousand,
            conversion_rate: e.conversionRate, miles_generated: e.milesGenerated,
            cost_per_mile: e.costPerMile, source_account_id: e.sourceAccountId,
            bonus_percent: e.bonusPercent, date: e.date, description: e.description,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration entries:", error.message);
      }

      // Migrate clients
      if (data.clients?.length) {
        const { error } = await supabase.from("clients").upsert(
          data.clients.map((c: Client) => ({
            id: c.id, user_id: userId, name: c.name, cpf: c.cpf, email: c.email,
            phone: c.phone, telegram: c.telegram, total_purchases: c.totalPurchases,
            usage_history: c.usageHistory,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration clients:", error.message);
      }

      // Migrate sales
      if (data.sales?.length) {
        const { error } = await supabase.from("sales").upsert(
          data.sales.map((s: Sale) => ({
            id: s.id, user_id: userId, account_id: s.accountId, account_name: s.accountName,
            owner_name: s.ownerName, program: s.program, client_id: s.clientId,
            client_name: s.clientName, miles_used: s.milesUsed, sale_value: s.saleValue,
            price_per_mile: s.pricePerMile, cost_per_mile: s.costPerMile,
            additional_cost: s.additionalCost, additional_cost_desc: s.additionalCostDesc,
            profit: s.profit, profit_margin: s.profitMargin, status: s.status,
            ticket_locator: s.ticketLocator, passengers: s.passengers, date: s.date,
          })),
          { onConflict: "id" }
        );
        if (error) console.warn("Migration sales:", error.message);
      }

      // Clear localStorage
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));

      queryClient.invalidateQueries();
    };

    migrate();
  }, [user]);

  // ── Mutation wrappers ──

  const addOwnerM = useAddOwnerMutation();
  const updateOwnerM = useUpdateOwnerMutation();
  const deleteOwnerM = useDeleteOwnerMutation();

  const addProgramM = useAddProgramMutation();
  const updateProgramM = useUpdateProgramMutation();
  const deleteProgramM = useDeleteProgramMutation();

  const addOrigemTypeM = useAddOrigemTypeMutation();
  const updateOrigemTypeM = useUpdateOrigemTypeMutation();
  const deleteOrigemTypeM = useDeleteOrigemTypeMutation();

  const addAccountM = useAddAccountMutation();
  const updateAccountM = useUpdateAccountMutation();
  const deleteAccountM = useDeleteAccountMutation();

  const addEntryM = useAddEntryMutation();
  const deleteEntryM = useDeleteEntryMutation();

  const addSaleM = useAddSaleMutation();
  const updateSaleM = useUpdateSaleMutation();
  const deleteSaleM = useDeleteSaleMutation();

  const addClientM = useAddClientMutation();
  const updateClientM = useUpdateClientMutation();
  const deleteClientM = useDeleteClientMutation();

  const addOwner = (data: Omit<Owner, "id">) => {
    const id = crypto.randomUUID();
    addOwnerM.mutate({ id, ...data });
  };

  const updateOwner = (id: string, data: Partial<Owner>) => {
    updateOwnerM.mutate({ id, ...data });
  };

  const deleteOwner = (id: string) => {
    deleteOwnerM.mutate(id);
  };

  const addProgram = (data: Omit<Program, "id">) => {
    const id = crypto.randomUUID();
    addProgramM.mutate({ id, ...data });
  };

  const updateProgram = (id: string, data: Partial<Program>) => {
    updateProgramM.mutate({ id, ...data });
  };

  const deleteProgram = (id: string) => {
    deleteProgramM.mutate(id);
  };

  const addOrigemType = (data: Omit<OrigemType, "id">, id?: string) => {
    addOrigemTypeM.mutate({ id: id ?? crypto.randomUUID(), ...data });
  };

  const updateOrigemType = (id: string, data: Partial<OrigemType>) => {
    if (id === TRANSFERENCIA_ID) return;
    updateOrigemTypeM.mutate({ id, ...data });
  };

  const deleteOrigemType = (id: string) => {
    if (id === TRANSFERENCIA_ID) return;
    deleteOrigemTypeM.mutate(id);
  };

  const addAccount = (data: Omit<Account, "id" | "createdAt">) => {
    const id = crypto.randomUUID();
    addAccountM.mutate({
      id, ...data,
      createdAt: new Date().toISOString().split("T")[0],
    });
  };

  const updateAccount = (id: string, data: Partial<Account>) => {
    updateAccountM.mutate({ id, ...data });
  };

  const deleteAccount = (id: string) => {
    deleteAccountM.mutate(id);
  };

  const addEntry = (data: Omit<PointEntry, "id">) => {
    addEntryM.mutate({ id: crypto.randomUUID(), ...data });
  };

  const deleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) deleteEntryM.mutate(entry);
  };

  const addSale = (data: Omit<Sale, "id">) => {
    addSaleM.mutate({ id: crypto.randomUUID(), ...data });
  };

  const updateSale = (id: string, data: Partial<Sale>) => {
    updateSaleM.mutate({ id, ...data });
  };

  const deleteSale = (id: string) => {
    deleteSaleM.mutate(id);
  };

  const addClient = (data: Omit<Client, "id">, id?: string) => {
    addClientM.mutate({ id: id ?? crypto.randomUUID(), ...data });
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    updateClientM.mutate({ id, ...data });
  };

  const deleteClient = (id: string) => {
    deleteClientM.mutate(id);
  };

  return (
    <DataContext.Provider value={{
      owners, programs, origemTypes, accounts, entries, sales, clients,
      addOwner, updateOwner, deleteOwner,
      addProgram, updateProgram, deleteProgram,
      addOrigemType, updateOrigemType, deleteOrigemType,
      addAccount, updateAccount, deleteAccount,
      addEntry, deleteEntry,
      addSale, updateSale, deleteSale,
      addClient, updateClient, deleteClient,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

// ── LocalStorage migration helpers ──

function loadStorageData(): Record<string, unknown[]> | null {
  try {
    const prefix = STORAGE_PREFIX;
    const keys = ["owners", "programs", "origemTypes", "accounts", "entries", "clients", "sales"];
    let hasData = false;
    const data: Record<string, unknown[]> = {};
    for (const key of keys) {
      const raw = localStorage.getItem(prefix + key);
      if (raw) {
        data[key] = JSON.parse(raw);
        hasData = true;
      }
    }
    return hasData ? data : null;
  } catch {
    return null;
  }
}
