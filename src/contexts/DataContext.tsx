import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Owner, Program, OrigemType, Account, PointEntry, Sale, Client } from "@/types";

interface DataContextType {
  owners: Owner[]
  programs: Program[]
  origemTypes: OrigemType[]
  accounts: Account[]
  entries: PointEntry[]
  sales: Sale[]
  clients: Client[]

  // Owners
  addOwner: (data: Omit<Owner, "id">) => void
  updateOwner: (id: string, data: Partial<Owner>) => void
  deleteOwner: (id: string) => void

  // Programs
  addProgram: (data: Omit<Program, "id">) => void
  updateProgram: (id: string, data: Partial<Program>) => void
  deleteProgram: (id: string) => void

  // Origem Types
  addOrigemType: (data: Omit<OrigemType, "id">, id?: string) => void
  updateOrigemType: (id: string, data: Partial<OrigemType>) => void
  deleteOrigemType: (id: string) => void

  // Accounts
  addAccount: (data: Omit<Account, "id" | "createdAt">) => void
  updateAccount: (id: string, data: Partial<Account>) => void
  deleteAccount: (id: string) => void

  // Entries
  addEntry: (data: Omit<PointEntry, "id">) => void
  deleteEntry: (id: string) => void

  // Sales
  addSale: (data: Omit<Sale, "id">) => void
  updateSale: (id: string, data: Partial<Sale>) => void
  deleteSale: (id: string) => void

  // Clients
  addClient: (data: Omit<Client, "id">, id?: string) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
}

const DataContext = createContext<DataContextType | null>(null);

const STORAGE_PREFIX = "mc-";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function persistToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable
  }
}

const initialOwners: Owner[] = [];

const initialPrograms: Program[] = [];

const initialOrigemTypes: OrigemType[] = [];

const initialAccounts: Account[] = [];

const initialEntries: PointEntry[] = [];

const initialClients: Client[] = [];

const initialSales: Sale[] = [];

export function DataProvider({ children }: { children: ReactNode }) {
  const [owners, setOwners] = useState<Owner[]>(() => loadFromStorage("owners", initialOwners));
  const [programs, setPrograms] = useState<Program[]>(() => loadFromStorage("programs", initialPrograms));
  const [origemTypes, setOrigemTypes] = useState<OrigemType[]>(() => loadFromStorage("origemTypes", initialOrigemTypes));
  const [accounts, setAccounts] = useState<Account[]>(() => loadFromStorage("accounts", initialAccounts));
  const [entries, setEntries] = useState<PointEntry[]>(() => loadFromStorage("entries", initialEntries));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage("sales", initialSales));
  const [clients, setClients] = useState<Client[]>(() => loadFromStorage("clients", initialClients));

  useEffect(() => { persistToStorage("owners", owners); }, [owners]);
  useEffect(() => { persistToStorage("programs", programs); }, [programs]);
  useEffect(() => { persistToStorage("origemTypes", origemTypes); }, [origemTypes]);
  useEffect(() => { persistToStorage("accounts", accounts); }, [accounts]);
  useEffect(() => { persistToStorage("entries", entries); }, [entries]);
  useEffect(() => { persistToStorage("sales", sales); }, [sales]);
  useEffect(() => { persistToStorage("clients", clients); }, [clients]);

  const addOwner = (data: Omit<Owner, "id">) =>
    setOwners(prev => [...prev, { id: crypto.randomUUID(), ...data }]);

  const updateOwner = (id: string, data: Partial<Owner>) =>
    setOwners(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));

  const deleteOwner = (id: string) =>
    setOwners(prev => prev.filter(o => o.id !== id));

  const addProgram = (data: Omit<Program, "id">) =>
    setPrograms(prev => [...prev, { id: crypto.randomUUID(), ...data }]);

  const updateProgram = (id: string, data: Partial<Program>) =>
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

  const deleteProgram = (id: string) =>
    setPrograms(prev => prev.filter(p => p.id !== id));

  const addOrigemType = (data: Omit<OrigemType, "id">, id?: string) =>
    setOrigemTypes(prev => [...prev, { id: id ?? crypto.randomUUID(), ...data }]);

  const updateOrigemType = (id: string, data: Partial<OrigemType>) =>
    setOrigemTypes(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));

  const deleteOrigemType = (id: string) =>
    setOrigemTypes(prev => prev.filter(o => o.id !== id));

  const addAccount = (data: Omit<Account, "id" | "createdAt">) =>
    setAccounts(prev => [...prev, {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString().split("T")[0],
    }]);

  const updateAccount = (id: string, data: Partial<Account>) =>
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));

  const deleteAccount = (id: string) =>
    setAccounts(prev => prev.filter(a => a.id !== id));

  const addEntry = (data: Omit<PointEntry, "id">) => {
    const entry = { id: crypto.randomUUID(), ...data };
    setEntries(prev => [...prev, entry]);
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== entry.accountId) return acc;
      const amountToAdd = entry.milesGenerated ?? entry.amount;
      const newBalance = acc.balance + amountToAdd;
      const newTotalInvested = (acc.totalInvested ?? 0) + entry.amountPaid;
      return {
        ...acc,
        balance: newBalance,
        totalInvested: newTotalInvested,
        averageCostPerMile: newBalance > 0 ? newTotalInvested / newBalance : acc.averageCostPerMile,
      };
    }));
    if (entry.sourceAccountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id !== entry.sourceAccountId) return acc;
        const avgCost = acc.balance > 0 ? (acc.totalInvested ?? 0) / acc.balance : 0;
        const costToRemove = entry.amount * avgCost;
        const newBalance = Math.max(0, acc.balance - entry.amount);
        const newTotalInvested = Math.max(0, (acc.totalInvested ?? 0) - costToRemove);
        return {
          ...acc,
          balance: newBalance,
          totalInvested: newTotalInvested,
          averageCostPerMile: newBalance > 0 ? newTotalInvested / newBalance : 0,
        };
      }));
    }
  };

  const deleteEntry = (id: string) => {
    const entry = entries.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (entry) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id !== entry.accountId) return acc;
        const amountToRemove = entry.milesGenerated ?? entry.amount;
        const newBalance = Math.max(0, acc.balance - amountToRemove);
        const newTotalInvested = Math.max(0, (acc.totalInvested ?? 0) - entry.amountPaid);
        return {
          ...acc,
          balance: newBalance,
          totalInvested: newTotalInvested,
          averageCostPerMile: newBalance > 0 ? newTotalInvested / newBalance : 0,
        };
      }));
      if (entry.sourceAccountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id !== entry.sourceAccountId) return acc;
          const avgCostAtTransfer = entry.amount > 0 ? entry.amountPaid / entry.amount : 0;
          const costToRestore = entry.amount * avgCostAtTransfer;
          const newBalance = acc.balance + entry.amount;
          const newTotalInvested = (acc.totalInvested ?? 0) + costToRestore;
          return {
            ...acc,
            balance: newBalance,
            totalInvested: newTotalInvested,
            averageCostPerMile: newBalance > 0 ? newTotalInvested / newBalance : 0,
          };
        }));
      }
    }
  };

  const addSale = (data: Omit<Sale, "id">) =>
    setSales(prev => [...prev, { id: crypto.randomUUID(), ...data }]);

  const updateSale = (id: string, data: Partial<Sale>) =>
    setSales(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));

  const deleteSale = (id: string) =>
    setSales(prev => prev.filter(s => s.id !== id));

  const addClient = (data: Omit<Client, "id">, id?: string) =>
    setClients(prev => [...prev, { id: id ?? crypto.randomUUID(), ...data }]);

  const updateClient = (id: string, data: Partial<Client>) =>
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));

  const deleteClient = (id: string) =>
    setClients(prev => prev.filter(c => c.id !== id));

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
