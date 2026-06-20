import { createContext, useContext, useState, type ReactNode } from "react";
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

const initialOwners: Owner[] = [
  { id: "1", name: "João Silva", cpf: "123.456.789-00", phone: "(11) 99999-9999" },
  { id: "2", name: "Maria Santos", cpf: "987.654.321-00", phone: "(11) 88888-8888" },
  { id: "3", name: "Pedro Costa", cpf: "456.789.123-00", phone: "(11) 77777-7777" },
];

const initialPrograms: Program[] = [
  { id: "1", name: "LATAM Pass", type: "milhas" },
  { id: "2", name: "Smiles", type: "milhas" },
  { id: "3", name: "Livelo", type: "pontos" },
  { id: "4", name: "Esfera", type: "pontos" },
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
  { id: "3", name: "Livelo Gold", ownerId: "1", programId: "3", type: "milhas", balance: 80000, averageCostPerMile: 0.005, totalInvested: 400, status: "ativa", createdAt: "2024-01-01" },
  { id: "4", name: "Esfera Black", ownerId: "3", programId: "4", type: "milhas", balance: 0, averageCostPerMile: 0.006, totalInvested: 0, status: "inativa", createdAt: "2024-01-01" },
];

const initialEntries: PointEntry[] = [
  { id: "1", accountId: "1", origemTypeId: "3", amount: 100000, amountPaid: 450, costPerThousand: 4.5, conversionRate: 1.0, milesGenerated: 100000, costPerMile: 0.0045, date: "2024-01-15" },
  { id: "2", accountId: "2", origemTypeId: "2", amount: 80000, amountPaid: 360, costPerThousand: 4.5, conversionRate: 0.8, milesGenerated: 64000, costPerMile: 0.005625, date: "2024-01-16" },
];

const initialClients: Client[] = [
  { id: "1", name: "João Silva", cpf: "123.456.789-00", email: "joao.silva@email.com", phone: "(11) 99999-9999", totalPurchases: 5, usageHistory: [{ program: "LATAM Pass", count: 3, year: 2024 }, { program: "Smiles", count: 2, year: 2024 }] },
  { id: "2", name: "Maria Santos", cpf: "987.654.321-00", email: "maria.santos@email.com", phone: "(11) 88888-8888", totalPurchases: 8, usageHistory: [{ program: "LATAM Pass", count: 4, year: 2024 }, { program: "Livelo", count: 3, year: 2024 }, { program: "Smiles", count: 1, year: 2024 }] },
  { id: "3", name: "Pedro Costa", cpf: "456.789.123-00", email: "pedro.costa@email.com", phone: "(11) 77777-7777", totalPurchases: 3, usageHistory: [{ program: "Livelo", count: 2, year: 2024 }, { program: "Esfera", count: 1, year: 2024 }] },
];

const initialSales: Sale[] = [
  { id: "1", accountId: "1", clientId: "1", clientName: "Carlos Mendes", milesUsed: 50000, saleValue: 300, costPerMile: 0.0045, profit: 75, profitMargin: 25, status: "concluido", ticketLocator: "ABC123", passengers: [{ name: "Carlos Mendes", cpf: "123.456.789-00" }], date: "2024-01-20" },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [owners, setOwners] = useState<Owner[]>(initialOwners);
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [origemTypes, setOrigemTypes] = useState<OrigemType[]>(initialOrigemTypes);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [entries, setEntries] = useState<PointEntry[]>(initialEntries);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [clients, setClients] = useState<Client[]>(initialClients);

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
