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
  date: string
  description?: string
}

export interface Sale {
  id: string
  accountId: string
  clientName: string
  milesUsed: number
  saleValue: number
  costPerMile: number
  profit: number
  profitMargin: number
  status: 'pendente' | 'pago' | 'concluido'
  ticketLocator: string
  passengers: { name: string; cpf: string }[]
  date: string
}
