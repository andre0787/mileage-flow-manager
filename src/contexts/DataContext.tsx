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
  addOrigemType: (data: Omit<OrigemType, "id">) => void
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
  } catch {}
}

const initialOwners: Owner[] = [
  { id: "1", name: "João Silva", cpf: "123.456.789-00", phone: "(11) 99999-9999" },
  { id: "2", name: "Maria Santos", cpf: "987.654.321-00", phone: "(11) 88888-8888" },
];

const initialPrograms: Program[] = [
  { id: "1", name: "LATAM Pass", type: "milhas" },
  { id: "2", name: "Smiles", type: "milhas" },
];

const initialOrigemTypes: OrigemType[] = [
  { id: "1", name: "Cartão de Crédito", accountType: "pontos", color: "#3b82f6" },
  { id: "2", name: "Clube de Pontos", accountType: "pontos", color: "#8b5cf6" },
  { id: "3", name: "Compra Direta", accountType: "milhas", color: "#10b981" },
  { id: "4", name: "Transferência", accountType: "milhas", color: "#f59e0b" },
  { id: "5", name: "Bonificação", accountType: "milhas", color: "#ef4444" },
  { id: "6", name: "Promoção", accountType: "milhas", color: "#06b6d4" },
];

const initialAccounts: Account[] = [
  { id: "1", name: "Conta Principal LATAM", ownerId: "1", programId: "1", type: "milhas", balance: 400000, averageCostPerMile: 0.0045, totalInvested: 1800, status: "ativa", createdAt: "2024-01-01" },
  { id: "2", name: "Smiles Premium", ownerId: "2", programId: "2", type: "milhas", balance: 64000, averageCostPerMile: 0.005625, totalInvested: 360, status: "ativa", createdAt: "2024-01-01" },
];

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

  const addOrigemType = (data: Omit<OrigemType, "id">) =>
    setOrigemTypes(prev => [...prev, { id: crypto.randomUUID(), ...data }]);

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

  const addEntry = (data: Omit<PointEntry, "id">) =>
    setEntries(prev => [...prev, { id: crypto.randomUUID(), ...data }]);

  const deleteEntry = (id: string) =>
    setEntries(prev => prev.filter(e => e.id !== id));

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
