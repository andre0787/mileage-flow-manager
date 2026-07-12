import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnersQuery, useProgramsQuery, useOrigemTypesQuery, useAccountsQuery, useEntriesQuery, useClientsQuery, useSalesQuery } from "@/hooks/useDatabase";
import { useClearAccountDataMutation } from "@/hooks/useDatabase";
import { isTransferencia } from "@/lib/utils";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";

interface DataContextType {
  owners: Owner[]
  programs: Program[]
  origemTypes: OrigemType[]
  accounts: Account[]
  entries: PointEntry[]
  sales: Sale[]
  clients: Client[]
  isLoading: boolean
  clearCache: () => void
  clearAccountData: () => void
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ownersQ = useOwnersQuery();
  const programsQ = useProgramsQuery();
  const origemTypesQ = useOrigemTypesQuery();
  const accountsQ = useAccountsQuery();
  const entriesQ = useEntriesQuery();
  const clientsQ = useClientsQuery();
  const salesQ = useSalesQuery();

  const isLoading = ownersQ.isPending || programsQ.isPending || origemTypesQ.isPending || accountsQ.isPending || entriesQ.isPending || clientsQ.isPending || salesQ.isPending;

  const owners = ownersQ.data ?? [];
  const programs = programsQ.data ?? [];
  const origemTypes = origemTypesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const entries = entriesQ.data ?? [];
  const clients = clientsQ.data ?? [];
  const sales = salesQ.data ?? [];

  // Ensure built-in TRANSFERENCIA type exists for every user
  const creatingTransferencia = useRef(false);
  useEffect(() => {
    if (!user || creatingTransferencia.current) return;
    const hasBuiltin = origemTypes.some((ot) => isTransferencia(ot));
    if (!hasBuiltin) {
      creatingTransferencia.current = true;
      // ponytail: Supabase Insert type expects optional fields, cast needed for runtime safety
      supabase.from("origem_types").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: "Transferência",
        account_type: "milhas",
        color: "#8b5cf6",
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["origem_types"] });
        creatingTransferencia.current = false;
      });
    }
  }, [user, origemTypes]);

  const clearAccountM = useClearAccountDataMutation();

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("mc-") || k === "mc-migrated");
    keys.forEach(k => localStorage.removeItem(k));
    // ponytail: reload descarta cache in-memory, queryClient.clear() só causava re-render com erro
    window.location.reload();
  };

  const clearAccountData = () => {
    clearAccountM.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        clearCache(); // também limpa localStorage (mc-debug-logs, etc)
      },
    });
  };

  return (
    <DataContext.Provider value={{
      owners, programs, origemTypes, accounts, entries, sales, clients,
      isLoading,
      clearCache, clearAccountData,
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
