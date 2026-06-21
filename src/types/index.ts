export interface Client {
  id: string
  name: string
  cpf?: string
  email?: string
  phone: string
  telegram?: string
  totalPurchases: number
  usageHistory: {
    program: string
    count: number
    year: number
  }[]
}

export interface Owner {
  id: string
  name: string
  cpf: string
  phone: string
}

export interface Program {
  id: string
  name: string
  type: 'pontos' | 'milhas'
  maxPassengers?: number
  passengerCycleType?: 'anual' | 'dias'
  passengerCycleDays?: number
}

export interface OrigemType {
  id: string
  name: string
  accountType: 'pontos' | 'milhas'
  color: string
}

export interface Account {
  id: string
  name: string
  ownerId: string
  programId: string
  type: 'pontos' | 'milhas'
  balance: number
  averageCostPerMile?: number
  totalInvested?: number
  status: 'ativa' | 'inativa'
  createdAt: string
}

export interface PointEntry {
  id: string
  accountId: string
  origemTypeId: string
  amount: number
  amountPaid: number
  costPerThousand: number
  conversionRate?: number
  milesGenerated?: number
  costPerMile?: number
  sourceAccountId?: string
  bonusPercent?: number
  date: string
  description?: string
}

export interface Sale {
  id: string
  accountId?: string
  accountName: string
  ownerName: string
  program: string
  clientId: string
  clientName: string
  milesUsed: number
  saleValue: number
  pricePerMile?: number
  costPerMile: number
  additionalCost?: number
  additionalCostDesc?: string
  profit: number
  profitMargin: number
  status: 'pendente' | 'pago' | 'concluido'
  ticketLocator: string
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
  date: string
}
