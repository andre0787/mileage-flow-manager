export interface Client {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone: string;
  telegram?: string;
  totalPurchases: number;
  usageHistory: {
    program: string;
    count: number;
    year: number;
  }[];
}

export interface Owner {
  id: string;
  name: string;
  cpf: string;
  phone: string;
}

export interface Program {
  id: string;
  name: string;
  type: "pontos" | "milhas";
  maxPassengers?: number;
  passengerCycleType?: "anual" | "dias";
  passengerCycleDays?: number;
}

export interface OrigemType {
  id: string;
  name: string;
  accountType: "pontos" | "milhas";
  color: string;
  description?: string;
}

export interface Account {
  id: string;
  name: string;
  ownerId: string;
  programId: string;
  type: "pontos" | "milhas";
  balance: number;
  averageCostPerMile?: number;
  totalInvested?: number;
  status: "ativa" | "inativa";
  createdAt: string;
}

export type EntryStatus = "confirmada" | "aguardando";

export interface PointEntry {
  id: string;
  accountId: string;
  origemTypeId: string;
  amount: number;
  amountPaid: number;
  costPerThousand: number;
  conversionRate?: number;
  milesGenerated?: number;
  costPerMile?: number;
  sourceAccountId?: string;
  bonusPercent?: number;
  /** Quantidade de pontos extras comprados no carrinho (transferência) */
  cartAmount?: number;
  /** Valor total pago pelos pontos extras do carrinho */
  cartCost?: number;
  /** Status da entrada: confirmada (padrão) ou aguardando (gerada por recorrência) */
  entryStatus?: EntryStatus;
  /** ID da entrada pai (para entradas geradas por recorrência) */
  parentEntryId?: string;
  /** Intervalo em dias entre recorrências */
  recurrenceInterval?: number;
  /** Data final da recorrência */
  recurrenceEnd?: string;
  /** Modo de distribuição dos valores nas recorrências: split (divide) ou repeat (repete) */
  recurrenceValueMode?: 'split' | 'repeat';
  date: string;
  description?: string;
}

/** Serializa cart e clube fields para description como JSON (entries). Distinto de serializeOrigemTypeDescription em lib/origemTypes.ts. */
export function serializeDescription(opts: {
  cartAmount?: number;
  cartCost?: number;
  entryStatus?: EntryStatus;
  parentEntryId?: string;
  recurrenceInterval?: number;
  recurrenceEnd?: string;
  recurrenceValueMode?: 'split' | 'repeat';
}): string | undefined {
  const obj: Record<string, unknown> = {};
  if (opts.cartAmount && opts.cartAmount > 0) {
    obj.cartAmount = opts.cartAmount;
    obj.cartCost = opts.cartCost;
  }
  if (opts.entryStatus && opts.entryStatus !== "confirmada") obj.entryStatus = opts.entryStatus;
  if (opts.parentEntryId) obj.parentEntryId = opts.parentEntryId;
  if (opts.recurrenceInterval) obj.recurrenceInterval = opts.recurrenceInterval;
  if (opts.recurrenceEnd) obj.recurrenceEnd = opts.recurrenceEnd;
  if (opts.recurrenceValueMode) obj.recurrenceValueMode = opts.recurrenceValueMode;
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined;
}

/** Extrai todos os campos do description (JSON) */
export function parseDescription(description?: string | null): {
  cartAmount?: number;
  cartCost?: number;
  entryStatus?: EntryStatus;
  parentEntryId?: string;
  recurrenceInterval?: number;
  recurrenceEnd?: string;
  recurrenceValueMode?: 'split' | 'repeat';
} {
  if (!description) return {};
  try {
    return JSON.parse(description);
  } catch {
    // ponytail: descrição não-JSON → objeto vazio
  }
  return {};
}

export interface Sale {
  id: string;
  accountId?: string;
  accountName: string;
  ownerName: string;
  program: string;
  clientId: string;
  clientName: string;
  milesUsed: number;
  saleValue: number;
  pricePerMile?: number;
  costPerMile: number;
  additionalCost?: number;
  additionalCostDesc?: string;
  profit: number;
  profitMargin: number;
  status: "pendente" | "pago" | "concluido" | "cancelado";
  ticketLocator: string;
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[];
  date: string;
}
