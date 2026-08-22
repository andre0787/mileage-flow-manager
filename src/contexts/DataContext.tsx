import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth";
import {
  useOwnersQuery,
  useProgramsQuery,
  useOrigemTypesQuery,
  useAccountsQuery,
  useEntriesQuery,
  useClientsQuery,
  useSalesQuery,
  useClearAccountDataMutation,
} from "@/hooks/useDatabase";
import { isTransferencia } from "@/lib/utils";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";

interface DataContextType {
  owners: Owner[];
  programs: Program[];
  origemTypes: OrigemType[];
  accounts: Account[];
  entries: PointEntry[];
  sales: Sale[];
  clients: Client[];
  isLoading: boolean;
  clearCache: () => void;
  clearAccountData: () => void;
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

  const isLoading =
    ownersQ.isPending ||
    programsQ.isPending ||
    origemTypesQ.isPending ||
    accountsQ.isPending ||
    entriesQ.isPending ||
    clientsQ.isPending ||
    salesQ.isPending;

  const owners = ownersQ.data ?? [];
  const programs = programsQ.data ?? [];
  const origemTypes = origemTypesQ.data ?? [];
  const accounts = accountsQ.data ?? [];
  const entries = entriesQ.data ?? [];
  const clients = clientsQ.data ?? [];
  const sales = salesQ.data ?? [];

  const creatingTransferencia = useRef(false);
  useEffect(() => {
    if (!user || creatingTransferencia.current) return;
    if (origemTypes.some((ot) => isTransferencia(ot))) return;
    creatingTransferencia.current = true;
    supabase
      .from("origem_types")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: "Transferência",
        account_type: "milhas",
        color: "#8b5cf6",
      })
      .then(
        () => queryClient.invalidateQueries({ queryKey: ["origem_types"], refetchType: "all" }),
        (err) => console.error("[DataContext] falha ao criar tipo Transferência:", err),
      )
      .then(() => {
        creatingTransferencia.current = false;
      });
  }, [user, origemTypes, queryClient]);

  const clearAccountM = useClearAccountDataMutation();
  const clearCache = useCallback(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mc-") || k === "mc-migrated")
      .forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  const clearAccountData = useCallback(() => {
    clearAccountM.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        clearCache();
      },
    });
  }, [clearAccountM, clearCache, queryClient]);

  const value = useMemo(
    () => ({
      owners,
      programs,
      origemTypes,
      accounts,
      entries,
      sales,
      clients,
      isLoading,
      clearCache,
      clearAccountData,
    }),
    [
      owners,
      programs,
      origemTypes,
      accounts,
      entries,
      sales,
      clients,
      isLoading,
      clearCache,
      clearAccountData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
