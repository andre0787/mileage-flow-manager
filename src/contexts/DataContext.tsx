import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnersQuery, useProgramsQuery, useOrigemTypesQuery, useAccountsQuery, useEntriesQuery, useClientsQuery, useSalesQuery } from "@/hooks/useDatabase";
import { useAddOwnerMutation, useUpdateOwnerMutation, useDeleteOwnerMutation } from "@/hooks/useDatabase";
import { useAddProgramMutation, useUpdateProgramMutation, useDeleteProgramMutation } from "@/hooks/useDatabase";
import { useAddOrigemTypeMutation, useUpdateOrigemTypeMutation, useDeleteOrigemTypeMutation } from "@/hooks/useDatabase";
import { useAddAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from "@/hooks/useDatabase";
import { useAddEntryMutation, useDeleteEntryMutation } from "@/hooks/useDatabase";
import { useAddSaleMutation, useUpdateSaleMutation, useCancelSaleMutation, useDeleteSaleMutation } from "@/hooks/useDatabase";
import { useAddClientMutation, useUpdateClientMutation, useDeleteClientMutation } from "@/hooks/useDatabase";
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
  cancelSale: (id: string) => void
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
  const cancelSaleM = useCancelSaleMutation();
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
    const ot = origemTypes.find((o) => o.id === id);
    if (ot && isTransferencia(ot)) return;
    updateOrigemTypeM.mutate({ id, ...data });
  };

  const deleteOrigemType = (id: string) => {
    const ot = origemTypes.find((o) => o.id === id);
    if (ot && isTransferencia(ot)) return;
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

  const cancelSale = (id: string) => {
    cancelSaleM.mutate(id);
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
      addSale, updateSale, cancelSale, deleteSale,
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


