import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnersQuery, useProgramsQuery, useOrigemTypesQuery, useAccountsQuery, useEntriesQuery, useClientsQuery, useSalesQuery } from "@/hooks/useDatabase";
import { useClearAccountDataMutation } from "@/hooks/useDatabase";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";

export function isTransferencia(ot: OrigemType): boolean {
  return ot.name === "Transferência" && ot.accountType === "milhas";
}

interface DataContextType {
  owners: Owner[]
  programs: Program[]
  origemTypes: OrigemType[]
  accounts: Account[]
  entries: PointEntry[]
  sales: Sale[]
  clients: Client[]
  clearCache: () => void
  clearAccountData: () => void
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

  // Ensure built-in TRANSFERENCIA type exists for every user
  const creatingTransferencia = useRef(false);
  useEffect(() => {
    if (!user || creatingTransferencia.current) return;
    const hasBuiltin = origemTypes.some((ot) => isTransferencia(ot));
    if (!hasBuiltin) {
      creatingTransferencia.current = true;
      supabase.from("origem_types").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: "Transferência",
        account_type: "milhas",
        color: "#8b5cf6",
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["origem_types"] });
      }).finally(() => {
        creatingTransferencia.current = false;
      });
    }
  }, [user, origemTypes]);

  const clearAccountM = useClearAccountDataMutation();

  const clearCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("mc-") || k === "mc-migrated");
    keys.forEach(k => localStorage.removeItem(k));
    queryClient.clear();
    window.location.reload();
  };

  const clearAccountData = () => {
    clearAccountM.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.reload();
      },
    });
  };

  return (
    <DataContext.Provider value={{
      owners, programs, origemTypes, accounts, entries, sales, clients,
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
