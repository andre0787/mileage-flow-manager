import type { Owner, Program, Account, Client, Sale, PointEntry } from "@/types";

const o = () => crypto.randomUUID();
const d = (n: number) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().split("T")[0]; };

export const seedOwners: Owner[] = [
  { id: o(), name: "Ana", cpf: "111.222.333-44", phone: "(11) 99999-0001" },
  { id: o(), name: "Carlos", cpf: "555.666.777-88", phone: "(11) 99999-0002" },
];

export const seedPrograms: Program[] = [
  { id: o(), name: "Smiles", type: "milhas", maxPassengers: 5, passengerCycleType: "anual" },
  { id: o(), name: "LATAM Pass", type: "milhas", maxPassengers: 5, passengerCycleType: "dias", passengerCycleDays: 180 },
  { id: o(), name: "TudoAzul", type: "milhas", maxPassengers: 3, passengerCycleType: "anual" },
  { id: o(), name: "Livelo", type: "pontos", maxPassengers: 4, passengerCycleType: "dias", passengerCycleDays: 365 },
];

const [sm, la, az, li] = seedPrograms;

export const seedAccounts: Account[] = [
  { id: o(), name: "Smiles Ana", ownerId: seedOwners[0].id, programId: sm.id, type: "milhas", balance: 100000, averageCostPerMile: 0.02, totalInvested: 5000, status: "ativa", createdAt: "2026-01-01" },
  { id: o(), name: "Smiles Carlos", ownerId: seedOwners[1].id, programId: sm.id, type: "milhas", balance: 80000, averageCostPerMile: 0.02, totalInvested: 4000, status: "ativa", createdAt: "2026-01-01" },
  { id: o(), name: "LATAM Ana", ownerId: seedOwners[0].id, programId: la.id, type: "milhas", balance: 60000, averageCostPerMile: 0.02, totalInvested: 3000, status: "ativa", createdAt: "2026-01-01" },
  { id: o(), name: "LATAM Carlos", ownerId: seedOwners[1].id, programId: la.id, type: "milhas", balance: 40000, averageCostPerMile: 0.02, totalInvested: 2000, status: "ativa", createdAt: "2026-01-01" },
  { id: o(), name: "TudoAzul Ana", ownerId: seedOwners[0].id, programId: az.id, type: "milhas", balance: 50000, averageCostPerMile: 0.02, totalInvested: 2500, status: "ativa", createdAt: "2026-01-01" },
  { id: o(), name: "Livelo Ana", ownerId: seedOwners[0].id, programId: li.id, type: "pontos", balance: 30000, averageCostPerMile: 0.02, totalInvested: 1500, status: "ativa", createdAt: "2026-01-01" },
];

export const seedClients: Client[] = [
  { id: o(), name: "João Silva", cpf: "123.456.789-00", phone: "(11) 98888-0001", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Maria Santos", cpf: "987.654.321-00", phone: "(11) 98888-0002", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Pedro Costa", cpf: "456.789.123-00", phone: "(11) 98888-0003", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Ana Oliveira", cpf: "789.123.456-00", phone: "(11) 98888-0004", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Carlos Mendes", cpf: "321.654.987-00", phone: "(11) 98888-0005", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Lucia Ferreira", cpf: "654.987.321-00", phone: "(11) 98888-0006", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Rafael Souza", cpf: "147.258.369-00", phone: "(11) 98888-0007", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Beatriz Lima", cpf: "258.369.147-00", phone: "(11) 98888-0008", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Thiago Alves", cpf: "369.147.258-00", phone: "(11) 98888-0009", totalPurchases: 0, usageHistory: [] },
  { id: o(), name: "Fernanda Rocha", cpf: "159.753.486-00", phone: "(11) 98888-0010", totalPurchases: 0, usageHistory: [] },
];

const TRANSFERENCIA_ID = "135451fe-4144-46e2-bb9c-9c4e365a5f35";

export const seedEntries: PointEntry[] = [
  // Smiles Ana: 157k total (100k balance + 57k sold)
  { id: o(), accountId: seedAccounts[0].id, origemTypeId: TRANSFERENCIA_ID, amount: 100000, amountPaid: 2000, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 100000, date: d(120), description: "Compra de milhas" },
  { id: o(), accountId: seedAccounts[0].id, origemTypeId: TRANSFERENCIA_ID, amount: 57000, amountPaid: 1140, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 57000, date: d(60), description: "Compra de milhas" },
  // Smiles Carlos: 105k total (80k balance + 25k sold)
  { id: o(), accountId: seedAccounts[1].id, origemTypeId: TRANSFERENCIA_ID, amount: 105000, amountPaid: 2100, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 105000, date: d(90), description: "Compra de milhas" },
  // LATAM Ana: 90k total (60k balance + 30k sold)
  { id: o(), accountId: seedAccounts[2].id, origemTypeId: TRANSFERENCIA_ID, amount: 90000, amountPaid: 1800, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 90000, date: d(80), description: "Compra de milhas" },
  // LATAM Carlos: 50k total (40k balance + 10k sold)
  { id: o(), accountId: seedAccounts[3].id, origemTypeId: TRANSFERENCIA_ID, amount: 50000, amountPaid: 1000, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 50000, date: d(70), description: "Compra de milhas" },
  // TudoAzul Ana: 80k total (50k balance + 30k sold)
  { id: o(), accountId: seedAccounts[4].id, origemTypeId: TRANSFERENCIA_ID, amount: 80000, amountPaid: 1600, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 80000, date: d(50), description: "Compra de milhas" },
  // Livelo Ana: 30k total (30k balance)
  { id: o(), accountId: seedAccounts[5].id, origemTypeId: TRANSFERENCIA_ID, amount: 30000, amountPaid: 600, costPerThousand: 20, costPerMile: 0.02, milesGenerated: 30000, date: d(40), description: "Compra de pontos" },
];

export const seedSales: Sale[] = [
  { id: o(), accountName: "Smiles Ana", ownerName: "Ana", program: "Smiles", clientId: seedClients[0].id, clientName: "João Silva", milesUsed: 20000, saleValue: 800, pricePerMile: 0.04, costPerMile: 0.025, profit: 300, profitMargin: 0.375, status: "concluido", ticketLocator: "ABC123", passengers: [{ name: "João Silva", passengerId: "P001", cpf: "123.456.789-00", clientId: seedClients[0].id }, { name: "Maria Santos", passengerId: "P002", cpf: "987.654.321-00", clientId: seedClients[1].id }], date: d(30), accountId: seedAccounts[0].id },
  { id: o(), accountName: "Smiles Ana", ownerName: "Ana", program: "Smiles", clientId: seedClients[2].id, clientName: "Pedro Costa", milesUsed: 15000, saleValue: 600, pricePerMile: 0.04, costPerMile: 0.025, profit: 225, profitMargin: 0.375, status: "concluido", ticketLocator: "DEF456", passengers: [{ name: "Pedro Costa", passengerId: "P003", cpf: "456.789.123-00", clientId: seedClients[2].id }], date: d(20), accountId: seedAccounts[0].id },
  { id: o(), accountName: "Smiles Carlos", ownerName: "Carlos", program: "Smiles", clientId: seedClients[3].id, clientName: "Ana Oliveira", milesUsed: 25000, saleValue: 1000, pricePerMile: 0.04, costPerMile: 0.025, profit: 375, profitMargin: 0.375, status: "concluido", ticketLocator: "GHI789", passengers: [{ name: "Ana Oliveira", passengerId: "P004", cpf: "789.123.456-00", clientId: seedClients[3].id }, { name: "Carlos Mendes", passengerId: "P005", cpf: "321.654.987-00", clientId: seedClients[4].id }], date: d(15), accountId: seedAccounts[1].id },
  { id: o(), accountName: "LATAM Ana", ownerName: "Ana", program: "LATAM Pass", clientId: seedClients[0].id, clientName: "João Silva", milesUsed: 12000, saleValue: 500, pricePerMile: 0.04, costPerMile: 0.025, profit: 200, profitMargin: 0.4, status: "concluido", ticketLocator: "JKL012", passengers: [{ name: "João Silva", passengerId: "P006", cpf: "123.456.789-00", clientId: seedClients[0].id }, { name: "Lucia Ferreira", passengerId: "P007", cpf: "654.987.321-00", clientId: seedClients[5].id }], date: d(25), accountId: seedAccounts[2].id },
  { id: o(), accountName: "LATAM Ana", ownerName: "Ana", program: "LATAM Pass", clientId: seedClients[6].id, clientName: "Rafael Souza", milesUsed: 18000, saleValue: 720, pricePerMile: 0.04, costPerMile: 0.025, profit: 270, profitMargin: 0.375, status: "concluido", ticketLocator: "MNO345", passengers: [{ name: "Rafael Souza", passengerId: "P008", cpf: "147.258.369-00", clientId: seedClients[6].id }], date: d(10), accountId: seedAccounts[2].id },
  { id: o(), accountName: "LATAM Carlos", ownerName: "Carlos", program: "LATAM Pass", clientId: seedClients[4].id, clientName: "Carlos Mendes", milesUsed: 10000, saleValue: 400, pricePerMile: 0.04, costPerMile: 0.025, profit: 150, profitMargin: 0.375, status: "concluido", ticketLocator: "PQR678", passengers: [{ name: "Carlos Mendes", passengerId: "P009", cpf: "321.654.987-00", clientId: seedClients[4].id }], date: d(5), accountId: seedAccounts[3].id },
  { id: o(), accountName: "TudoAzul Ana", ownerName: "Ana", program: "TudoAzul", clientId: seedClients[7].id, clientName: "Beatriz Lima", milesUsed: 30000, saleValue: 1200, pricePerMile: 0.04, costPerMile: 0.025, profit: 450, profitMargin: 0.375, status: "concluido", ticketLocator: "STU901", passengers: [{ name: "Beatriz Lima", passengerId: "P010", cpf: "258.369.147-00", clientId: seedClients[7].id }], date: d(12), accountId: seedAccounts[4].id },
  { id: o(), accountName: "Smiles Ana", ownerName: "Ana", program: "Smiles", clientId: seedClients[8].id, clientName: "Thiago Alves", milesUsed: 22000, saleValue: 880, pricePerMile: 0.04, costPerMile: 0.025, profit: 330, profitMargin: 0.375, status: "concluido", ticketLocator: "VWX234", passengers: [{ name: "Thiago Alves", passengerId: "P011", cpf: "369.147.258-00", clientId: seedClients[8].id }, { name: "Fernanda Rocha", passengerId: "P012", cpf: "159.753.486-00", clientId: seedClients[9].id }], date: d(3), accountId: seedAccounts[0].id },
];
