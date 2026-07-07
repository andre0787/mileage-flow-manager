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
  /** Quantidade de pontos extras comprados no carrinho (transferência) */
  cartAmount?: number
  /** Valor total pago pelos pontos extras do carrinho */
  cartCost?: number
  date: string
  description?: string
}

/** Serializa cartAmount/cartCost para o campo description como JSON */
export function serializeCart(cartAmount?: number, cartCost?: number): string | undefined {
  if (cartAmount && cartAmount > 0) {
    return JSON.stringify({ cartAmount, cartCost });
  }
  return undefined;
}

/** Extrai cartAmount/cartCost do campo description (JSON) */
export function parseCart(description?: string | null): { cartAmount?: number; cartCost?: number } {
  if (!description) return {};
  try {
    const parsed = JSON.parse(description);
    if (typeof parsed.cartAmount === 'number') {
      return { cartAmount: parsed.cartAmount, cartCost: parsed.cartCost };
    }
  } catch {}
  return {};
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
  status: 'pendente' | 'pago' | 'concluido' | 'cancelado'
  ticketLocator: string
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
  date: string
}
