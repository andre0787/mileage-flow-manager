# Extração de Vendas.tsx — Plano de Implementação

> **For agentic workers:** Use inline execution (executing-plans) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extrair 4 componentes de `src/pages/Vendas.tsx` (1117 linhas → ~300), eliminar cálculos inline usando `calcProfit`/`calcProfitMargin`/`calcROI` de `src/lib/metrics.ts`.

**Architecture:** Seguir exatamente o padrão do #6 (Entradas). Cada componente em `src/components/` com props tipadas. A página orquestradora importa os 4 componentes e mantém só estado global + filtros + mutations.

**Tech Stack:** React 19, TypeScript 5, shadcn/ui, Supabase, canvas-confetti.

## Global Constraints

- pt-BR na interface
- Grid máximo 2 colunas: `grid-cols-1 sm:grid-cols-2`
- Imports usam path alias `@/` → `src/`
- `FormDrawer` em `src/components/FormDrawer.tsx` — `{open, onOpenChange, title, description?, children}`
- `MetricCard` em `src/components/MetricCard.tsx` — `{title, value, subtitle?, icon, trend?, variant?, prefix?}`
- `SkeletonMetricCard`, `SkeletonTable` em `src/components/SkeletonLoader.tsx`
- Funções de metrics.ts: `calcProfit(saleValue, milesUsed, costPerMile, additionalCost=0)`, `calcProfitMargin(profit, saleValue)`, `calcROI(profit, totalInvested)`
- Tipo `Sale` de `@/types`: `{id, accountId?, accountName, ownerName, program, clientId, clientName, milesUsed, saleValue, pricePerMile?, costPerMile, additionalCost?, additionalCostDesc?, profit, profitMargin, status, ticketLocator, passengers[], date}`
- Função `formatCPF` em `@/lib/utils`
- Não adicionar testes (tarefa #10 separada)
- Não alterar lógica de negócio

---

### Task 1: Criar `SaleMetrics.tsx`

**Files:**
- Create: `src/components/SaleMetrics.tsx`

**Interfaces:**
- Produces: `<SaleMetrics sales={Sale[]} className?: string />`

- [ ] **Step 1: Criar o arquivo**

```tsx
import { DollarSign, TrendingUp, Target, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetricCard } from "@/components/MetricCard"
import { calcProfitMargin } from "@/lib/metrics"
import type { Sale } from "@/types"

interface SaleMetricsProps {
  sales: Sale[]
  className?: string
}

export function SaleMetrics({ sales, className }: SaleMetricsProps) {
  const activeSales = sales.filter(s => s.status !== "cancelado")
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0)
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0)
  const totalMilesSold = activeSales.reduce((sum, s) => sum + s.milesUsed, 0)
  const margin = calcProfitMargin(totalProfit, totalRevenue)

  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300", className)}>
      <MetricCard title="Faturamento Total" value={totalRevenue} icon={DollarSign} prefix="R$" variant="default" />
      <MetricCard title="Lucro Total" value={totalProfit} icon={TrendingUp} prefix="R$" variant="success" />
      <MetricCard title="Milhas Vendidas" value={totalMilesSold.toLocaleString("pt-BR")} icon={Target} variant="default" />
      <MetricCard title="Margem Média" value={`${margin.toFixed(1)}%`} icon={Percent} variant="teal" />
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd /home/andreluiz0787/repos/mileage-flow-manager && npx tsc --noEmit 2>&1 | head -20
```

Expected: Nenhum erro no SaleMetrics.tsx.

---

### Task 2: Criar `SaleSimulator.tsx`

**Files:**
- Create: `src/components/SaleSimulator.tsx`

**Interfaces:**
- Produces: `<SaleSimulator open onOpenChange stockInfo />` — FormDrawer com inputs (milhas, preço/milha, custo/milha, custo adicional) + resultados via `calcProfit`/`calcProfitMargin`/`calcROI`

- [ ] **Step 1: Criar o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { calcProfit, calcProfitMargin, calcROI } from "@/lib/metrics"

export interface StockItem {
  accountId: string
  ownerName: string
  accountName: string
  averageCostPerMile: number
}

interface SaleSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockInfo: StockItem[]
}

export function SaleSimulator({ open, onOpenChange, stockInfo }: SaleSimulatorProps) {
  const [inputs, setInputs] = useState({
    accountId: "",
    miles: "",
    pricePerMile: "",
    costPerMile: "",
    additionalCost: "",
  })

  const handleSelectAccount = (accountId: string) => {
    const account = stockInfo.find(s => s.accountId === accountId)
    setInputs(prev => ({
      ...prev,
      accountId,
      costPerMile: account ? String(account.averageCostPerMile) : prev.costPerMile,
    }))
  }

  const results = useMemo(() => {
    const miles = parseFloat(inputs.miles) || 0
    const price = parseFloat(inputs.pricePerMile) || 0
    const cost = parseFloat(inputs.costPerMile) || 0
    const addCost = parseFloat(inputs.additionalCost) || 0
    const saleValue = miles * price
    const totalCost = miles * cost + addCost
    const profit = calcProfit(saleValue, miles, cost, addCost)
    const margin = calcProfitMargin(profit, saleValue)
    const roi = calcROI(profit, totalCost)
    return { saleValue, totalCost, profit, margin, roi }
  }, [inputs])

  const handleReset = () => {
    setInputs({ accountId: "", miles: "", pricePerMile: "", costPerMile: "", additionalCost: "" })
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={(open) => {
        if (!open) handleReset()
        onOpenChange(open)
      }}
      title="Simulador de Venda"
    >
      <div className="grid gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          Calcule rapidamente o lucro e a margem de uma venda sem criar registro.
        </p>

        <div className="space-y-2">
          <Label>Conta (opcional — preenche custo automaticamente)</Label>
          <Select value={inputs.accountId} onValueChange={handleSelectAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {stockInfo.map((s) => (
                <SelectItem key={s.accountId} value={s.accountId}>
                  {s.accountName} ({s.ownerName}) — R$ {s.averageCostPerMile.toFixed(4)}/milha
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simMiles">Milhas</Label>
            <Input id="simMiles" type="number" value={inputs.miles} onChange={(e) => setInputs({...inputs, miles: e.target.value})} placeholder="Ex: 50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simPrice">Preço por Milha (R$)</Label>
            <Input id="simPrice" type="number" step="0.0001" value={inputs.pricePerMile} onChange={(e) => setInputs({...inputs, pricePerMile: e.target.value})} placeholder="Ex: 0.03" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simCost">Custo por Milha (R$)</Label>
            <Input id="simCost" type="number" step="0.0001" value={inputs.costPerMile} onChange={(e) => setInputs({...inputs, costPerMile: e.target.value})} placeholder="Ex: 0.07" />
            {inputs.accountId && <p className="text-xs text-muted-foreground">Preenchido automaticamente da conta</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="simAddCost">Custo Adicional (R$)</Label>
            <Input id="simAddCost" type="number" step="0.01" value={inputs.additionalCost} onChange={(e) => setInputs({...inputs, additionalCost: e.target.value})} placeholder="Ex: 50.00" />
          </div>
        </div>

        {results.saleValue > 0 && (
          <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-3 animate-slide-up">
            <h4 className="font-semibold text-sm">Resultado da Simulação:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Valor da Venda:</span>
                <p className="font-bold text-lg">R$ {results.saleValue.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Custo Total:</span>
                <p className="font-semibold">R$ {results.totalCost.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Lucro:</span>
                <p className={`font-bold text-lg ${results.profit >= 0 ? "text-success" : "text-destructive"}`}>
                  {results.profit >= 0 ? "+" : ""}R$ {results.profit.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Margem:</span>
                <p className={`font-bold text-lg ${results.margin >= 0 ? "text-success" : "text-destructive"}`}>
                  {results.margin.toFixed(1)}%
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">ROI:</span>
                <p className={`font-bold text-lg ${results.roi >= 0 ? "text-success" : "text-destructive"}`}>
                  {results.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {parseFloat(inputs.miles) > 0 && results.saleValue === 0 && (
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
            Preencha o preço por milha para ver os resultados
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd /home/andreluiz0787/repos/mileage-flow-manager && npx tsc --noEmit 2>&1 | head -20
```

Expected: Nenhum erro.

---

### Task 3: Criar `SaleTable.tsx`

**Files:**
- Create: `src/components/SaleTable.tsx`

**Interfaces:**
- Produces: `<SaleTable sales onCancel? onStatusChange? />` — tabela desktop + lista mobile + AlertDialog de cancelamento (gerenciado internamente)

- [ ] **Step 1: Criar o arquivo**

```tsx
import { useState } from "react"
import { Package, TrendingDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/EmptyState"
import type { Sale } from "@/types"

interface SaleTableProps {
  sales: Sale[]
  onCancel?: (saleId: string) => void
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void
}

export function SaleTable({ sales, onCancel, onStatusChange }: SaleTableProps) {
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  if (sales.length === 0) {
    return (
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <EmptyState icon={Package} title="Nenhuma venda encontrada" description="Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer." />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dono/Programa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Milhas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className={sale.status === "cancelado" ? "opacity-50" : ""}>
                    <TableCell>{new Date(sale.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <p className="font-medium">{sale.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{sale.program}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{sale.clientName}</p>
                      <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
                    </TableCell>
                    <TableCell>{sale.milesUsed.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>R$ {sale.saleValue.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>
                      R$ {sale.profit.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{sale.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell>
                      {sale.status === "cancelado" ? (
                        <Badge variant="outline" className="text-destructive border-destructive">Cancelado</Badge>
                      ) : (
                        <Select value={sale.status} onValueChange={(v) => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                          <SelectTrigger className="w-28">
                            <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{sale.passengers.length} pax</span>
                        {sale.status !== "cancelado" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-6 text-xs" onClick={() => setCancelConfirmId(sale.id)}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className={`border rounded-lg p-4 space-y-3 ${sale.status === "cancelado" ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{sale.program}</p>
                    <p className="text-xs text-muted-foreground truncate">{sale.ownerName} • {new Date(sale.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {sale.status === "cancelado" ? (
                    <Badge variant="outline" className="text-destructive border-destructive shrink-0 ml-2">Cancelado</Badge>
                  ) : (
                    <Badge variant="outline" className={`shrink-0 ml-2 ${sale.status === "pendente" ? "text-warning border-warning" : sale.status === "pago" ? "text-primary border-primary" : "text-success border-success"}`}>
                      {sale.status === "pendente" ? "Pendente" : sale.status === "pago" ? "Pago" : "Concluído"}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Cliente:</span>
                    <p className="font-semibold truncate">{sale.clientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Milhas:</span>
                    <p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Valor:</span>
                    <p className="font-semibold">R$ {sale.saleValue.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Lucro:</span>
                    <p className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>R$ {sale.profit.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {sale.ticketLocator && <span className="truncate">Localizador: {sale.ticketLocator}</span>}
                    <span className="flex items-center gap-1 shrink-0"><Users className="h-3 w-3" />{sale.passengers.length} pax</span>
                  </div>
                </div>
                {sale.status !== "cancelado" && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]" onClick={() => setCancelConfirmId(sale.id)}>
                      Cancelar
                    </Button>
                    <div className="flex-1">
                      <Select value={sale.status} onValueChange={(v) => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                        <SelectTrigger className="w-full min-h-[44px]">
                          <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelConfirmId} onOpenChange={(open) => { if (!open) setCancelConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (cancelConfirmId) { onCancel?.(cancelConfirmId); setCancelConfirmId(null) } }}>
              Sim, cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 4: Criar `SaleForm.tsx`

**Files:**
- Create: `src/components/SaleForm.tsx`

**Interfaces:**
- Produces: `<SaleForm open onOpenChange accounts owners programs clients onSubmit onCreateClient />`

This component extracts ALL of the create form logic from Vendas.tsx:
- Owner → Account selector (filtrado por owner)
- Client selector + client creation dialog
- Miles, price, value, cost, additional cost inputs
- Passenger management (add/remove/update)
- Program cycle validation (CPF limit per cycle)
- Profit preview using `calcProfit`/`calcProfitMargin`
- Stock info display

- [ ] **Step 1: Criar o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { formatCPF } from "@/lib/utils"
import { calcProfit, calcProfitMargin } from "@/lib/metrics"
import type { Account, Owner, Program, Client } from "@/types"

export interface SaleFormData {
  ownerName: string
  accountId: string
  accountName: string
  program: string
  clientId: string
  clientName: string
  milesUsed: string
  pricePerMile: string
  saleValue: string
  additionalCost: string
  additionalCostDesc: string
  ticketLocator: string
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
}

interface StockInfo {
  accountId: string
  ownerId: string
  ownerName: string
  accountName: string
  programId: string
  program: string
  availableMiles: number
  averageCostPerMile: number
}

interface NewClientData {
  name: string
  cpf: string
  email: string
  phone: string
  telegram: string
}

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}

const createEmptyPassenger = () => ({ name: "", passengerId: crypto.randomUUID(), cpf: "", clientId: undefined as string | undefined })

const emptyForm: SaleFormData = {
  ownerName: "", accountId: "", accountName: "", program: "",
  clientId: "", clientName: "", milesUsed: "", pricePerMile: "",
  saleValue: "", additionalCost: "", additionalCostDesc: "",
  ticketLocator: "", passengers: [createEmptyPassenger()],
}

export function SaleForm({ open, onOpenChange, accounts, owners, programs, clients, onSubmit, onCreateClient }: SaleFormProps) {
  const [form, setForm] = useState<SaleFormData>(emptyForm)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState<NewClientData>({ name: "", cpf: "", email: "", phone: "", telegram: "" })
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({})

  // Derive stock info from accounts
  const stockInfo = useMemo(() => {
    return accounts
      .filter(a => a.type === "milhas" && a.status === "ativa")
      .map(a => ({
        accountId: a.id,
        ownerId: a.ownerId,
        ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
        accountName: a.name,
        programId: a.programId,
        program: programs.find(p => p.id === a.programId)?.name ?? "",
        availableMiles: a.balance,
        averageCostPerMile: a.averageCostPerMile ?? 0,
      }))
  }, [accounts, owners, programs])

  const ownersList = useMemo(() => [...new Set(stockInfo.map(s => s.ownerName))], [stockInfo])
  const selectedOwnerStock = useMemo(() => stockInfo.filter(s => s.ownerName === form.ownerName), [stockInfo, form.ownerName])
  const selectedProgramStock = useMemo(() => stockInfo.find(s => s.accountId === form.accountId), [stockInfo, form.accountId])
  const programConfig = useMemo(() => programs.find(p => p.id === selectedProgramStock?.programId), [programs, selectedProgramStock])

  // Passenger cycle validation
  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0
    // This would need sales data — passed from parent? For now keep it as a comment
    return 0
  }, [programConfig])

  const handleCreateClient = () => {
    const errs: Partial<Record<string, string>> = {}
    if (!newClient.name.trim()) errs.name = "Nome é obrigatório"
    setClientErrors(errs)
    if (Object.keys(errs).length > 0) return

    const id = crypto.randomUUID()
    onCreateClient({ id, ...newClient })
    setForm(prev => ({ ...prev, clientId: id, clientName: newClient.name.trim() }))
    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" })
    setClientErrors({})
    setIsClientDialogOpen(false)
  }

  const handleSubmit = () => {
    onSubmit(form)
    setForm(emptyForm)
  }

  const update = (partial: Partial<SaleFormData>) => setForm(prev => ({ ...prev, ...partial }))

  // Profit preview
  const profitPreview = useMemo(() => {
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null
    const milesUsed = parseFloat(form.milesUsed)
    const saleValue = parseFloat(form.saleValue)
    const additionalCost = parseFloat(form.additionalCost || "0")
    const costPerMile = selectedProgramStock.averageCostPerMile
    const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost)
    const margin = calcProfitMargin(profit, saleValue)
    return { costTotal: milesUsed * costPerMile, profit, margin }
  }, [form.milesUsed, form.saleValue, form.additionalCost, selectedProgramStock])

  return (
    <>
      <FormDrawer open={open} onOpenChange={(open) => { if (!open) { setForm(emptyForm) }; onOpenChange(open) }} title="Registrar Nova Venda">
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Owner + Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dono da Conta</Label>
              <Select value={form.ownerName} onValueChange={(v) => update({ ownerName: v, accountId: "", accountName: "", program: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecione o dono" /></SelectTrigger>
                <SelectContent>
                  {ownersList.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta / Programa</Label>
              <Select value={form.accountId} onValueChange={(v) => {
                const stock = selectedOwnerStock.find(s => s.accountId === v)
                update({ accountId: v, accountName: stock?.accountName ?? "", program: stock?.program ?? "" })
              }} disabled={!form.ownerName}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {selectedOwnerStock.map(s => (
                    <SelectItem key={s.accountId} value={s.accountId}>
                      {s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")} milhas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock info */}
          {selectedProgramStock && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-muted-foreground">Milhas disponíveis:</span><p className="font-semibold">{selectedProgramStock.availableMiles.toLocaleString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Custo médio por milha:</span><p className="font-semibold">R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}</p></div>
              </div>
            </div>
          )}

          {/* Client + Locator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={form.clientId} onValueChange={(v) => {
                    const client = clients.find(c => c.id === v)
                    update({ clientId: v, clientName: client?.name || "" })
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} title="Novo cliente">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localizador do Bilhete</Label>
              <Input value={form.ticketLocator} onChange={(e) => update({ ticketLocator: e.target.value })} placeholder="Ex: ABC123" />
            </div>
          </div>

          {/* Miles + Price + Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Milhas Utilizadas</Label>
              <Input type="number" value={form.milesUsed} onChange={(e) => {
                const val = e.target.value
                if (val && form.pricePerMile) {
                  update({ milesUsed: val, saleValue: (parseFloat(val) * parseFloat(form.pricePerMile)).toFixed(2) })
                } else {
                  update({ milesUsed: val })
                }
              }} placeholder="Ex: 50000" max={selectedProgramStock?.availableMiles} />
              {selectedProgramStock && <p className="text-xs text-muted-foreground">Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas</p>}
              {form.milesUsed && selectedProgramStock && parseFloat(form.milesUsed) > selectedProgramStock.availableMiles && (
                <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor por Milha (R$)</Label>
              <Input type="number" step="0.0001" value={form.pricePerMile} onChange={(e) => {
                const val = e.target.value
                if (val && form.milesUsed) {
                  update({ pricePerMile: val, saleValue: (parseFloat(val) * parseFloat(form.milesUsed)).toFixed(2) })
                } else {
                  update({ pricePerMile: val })
                }
              }} placeholder="Ex: 0.03" />
            </div>
            <div className="space-y-2">
              <Label>Valor da Venda (R$)</Label>
              <Input type="number" step="0.01" value={form.saleValue} onChange={(e) => update({ saleValue: e.target.value })} placeholder="Ex: 300.00" />
              {form.pricePerMile && form.milesUsed && (
                <p className="text-xs text-muted-foreground">
                  {parseFloat(form.milesUsed).toLocaleString("pt-BR")} × R$ {parseFloat(form.pricePerMile).toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Additional Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo Adicional (R$)</Label>
              <Input type="number" step="0.01" value={form.additionalCost} onChange={(e) => update({ additionalCost: e.target.value })} placeholder="Ex: 50.00" />
            </div>
            <div className="space-y-2">
              <Label>Observação do Custo</Label>
              <Input value={form.additionalCostDesc} onChange={(e) => update({ additionalCostDesc: e.target.value })} placeholder="Ex: Taxa de embarque" />
            </div>
          </div>

          {/* Profit Preview (using calcProfit/calcProfitMargin) */}
          {profitPreview && (
            <div className="p-3 bg-success-light rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Custo total:</span>
                  <p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p>
                </div>
                {form.additionalCost && parseFloat(form.additionalCost) > 0 && (
                  <div>
                    <span className="text-muted-foreground">Custo adicional:</span>
                    <p className="font-semibold text-destructive">R$ {parseFloat(form.additionalCost).toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Lucro:</span>
                  <p className="font-semibold text-success">R$ {profitPreview.profit.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Margem:</span>
                  <p className="font-semibold">{profitPreview.margin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Passageiros no Bilhete</Label>
              <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={() => update({ passengers: [...form.passengers, createEmptyPassenger()] })}>
                Adicionar
              </Button>
            </div>
            {form.passengers.map((passenger, index) => (
              <div key={index} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                <Select value={passenger.clientId ?? ""} onValueChange={(value) => {
                  if (value === "__manual__") {
                    const updated = form.passengers.map((p, i) => i === index ? { ...p, clientId: undefined, name: "", cpf: "" } : p)
                    update({ passengers: updated })
                  } else {
                    const client = clients.find(c => c.id === value)
                    if (client) {
                      const updated = form.passengers.map((p, i) => i === index ? { ...p, clientId: client.id, name: client.name, cpf: client.cpf ?? p.cpf } : p)
                      update({ passengers: updated })
                    }
                  }
                }}>
                  <SelectTrigger className="w-24 text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">— Manual —</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Nome completo" value={passenger.name} onChange={(e) => {
                  const updated = form.passengers.map((p, i) => i === index ? { ...p, name: e.target.value } : p)
                  update({ passengers: updated })
                }} />
                <Input placeholder="ID Passageiro" value={passenger.passengerId} disabled className="bg-muted/30 text-muted-foreground text-xs" />
                <Input placeholder="CPF" value={passenger.cpf} onChange={(e) => {
                  const updated = form.passengers.map((p, i) => i === index ? { ...p, cpf: e.target.value } : p)
                  update({ passengers: updated })
                }} />
                {form.passengers.length > 1 && (
                  <Button type="button" size="sm" variant="outline" className="min-h-[44px] min-w-[44px]" onClick={() => update({ passengers: form.passengers.filter((_, i) => i !== index) })}>
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Passenger limit validation */}
          {programConfig?.maxPassengers && (
            <PassengerLimitWarning programConfig={programConfig} formPassengers={form.passengers} usedPassengersInCycle={usedPassengersInCycle} />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90"
            disabled={!form.ownerName || !form.accountId || !form.program || !form.clientId || !form.milesUsed || !form.saleValue || (selectedProgramStock && parseFloat(form.milesUsed) > selectedProgramStock.availableMiles)}>
            Registrar Venda
          </Button>
        </div>
      </FormDrawer>

      {/* Client creation dialog */}
      <FormDrawer open={isClientDialogOpen} onOpenChange={(open) => { setIsClientDialogOpen(open); if (!open) setClientErrors({}) }} title="Novo Cliente">
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={newClient.name} onChange={(e) => { setNewClient(p => ({...p, name: e.target.value})); setClientErrors(prev => ({...prev, name: ""})) }} placeholder="Digite o nome completo" />
            {clientErrors.name && <p className="text-xs text-destructive">{clientErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={newClient.cpf} onChange={(e) => { const numbers = e.target.value.replace(/\D/g, "").slice(0, 11); setNewClient(p => ({...p, cpf: formatCPF(numbers)})) }} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={newClient.email} onChange={(e) => setNewClient(p => ({...p, email: e.target.value}))} placeholder="cliente@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={newClient.phone} onChange={(e) => setNewClient(p => ({...p, phone: e.target.value}))} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Contato Telegram</Label>
            <Input value={newClient.telegram} onChange={(e) => setNewClient(p => ({...p, telegram: e.target.value}))} placeholder="@usuario" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setIsClientDialogOpen(false); setClientErrors({}) }}>Cancelar</Button>
          <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">Cadastrar</Button>
        </div>
      </FormDrawer>
    </>
  )
}

/** Sub-componente para validação do limite de passageiros por ciclo */
function PassengerLimitWarning({
  programConfig,
  formPassengers,
  usedPassengersInCycle,
}: {
  programConfig: Program
  formPassengers: { name: string }[]
  usedPassengersInCycle: number
}) {
  const newCount = formPassengers.filter(p => p.name.trim()).length
  const totalAfter = usedPassengersInCycle + newCount
  if (totalAfter > programConfig.maxPassengers!) {
    return (
      <p className="text-xs text-destructive">
        Limite de {programConfig.maxPassengers} passageiros excedido para este ciclo.
        Usados: {usedPassengersInCycle} + {newCount} novo(s) = {totalAfter}
      </p>
    )
  }
  return null
}
```

Wait — there's an issue with `usedPassengersInCycle`. In the original code, this calculation uses `sales` data from Vendas.tsx:

```tsx
const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
    let relevantSales = sales.filter(s => s.program === newSale.program);
    // ...filter by cycle type...
    return relevantSales.reduce((sum, s) => sum + s.passengers.length, 0);
  }, [sales, newSale.program, programConfig]);
```

This needs `sales` data. I need to pass this to SaleForm somehow. Options:
1. Pass `sales` as prop and compute internally
2. Pass `usedPassengersInCycle` as computed prop
3. Omit this validation since it's a corner case

Option 2 is cleanest — let the parent compute it and pass as prop. Let me add it to the props.

Also, the `createEmptyPassenger` uses `crypto.randomUUID()` which is a browser API. That's fine for the frontend.

Let me reconsider the SaleForm interface to include `sales` or `usedPassengersInCycle`.

Actually, looking at the original more carefully, `usedPassengersInCycle` depends on `sales` (all sales, not just filtered). So the cleanest approach is to pass `sales` as a prop and compute internally. But that makes the interface larger.

Ponytail: simplest approach — pass `sales: Sale[]` as prop and let SaleForm compute it internally. That keeps computation where it's used.

Actually wait, the SaleForm's job is form state management. Passing `sales` just for this one validation seems overkill. Let me just pass `usedPassengersInCycle` directly as a prop — the parent already has `sales` and can compute it more efficiently.

Let me update the interface:

```tsx
interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  sales: Sale[]  // ← for passenger cycle validation
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}
```

- [ ] **Step 1: Criar o arquivo** (com a interface corrigida)

Actually, let me think about this differently. In the original Vendas.tsx, `usedPassengersInCycle` is computed in the page component using `sales` and `newSale.program`. I already moved `newSale` state inside SaleForm. So I need to either:

A) Pass `sales` to SaleForm so it can compute internally
B) Compute `usedPassengersInCycle` from parent and pass as prop

Option A is more self-contained. Let me do A since `sales` is already available at the page level.

Let me finalize the SaleForm with this approach and write the complete file code. Let me make sure the plan contains working code.

OK let me just write the plan now - I'll include the corrected interface with `sales`.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Extração de Vendas.tsx — Plano de Implementação

> **For agentic workers:** Use inline execution (executing-plans) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extrair 4 componentes de `src/pages/Vendas.tsx` (1117 linhas → ~300), eliminar cálculos inline usando `calcProfit`/`calcProfitMargin`/`calcROI` de `src/lib/metrics.ts`.

**Architecture:** Seguir exatamente o padrão do #6 (Entradas). Componentes em `src/components/` com props tipadas. Página orquestradora mantém só estado global + filtros + mutations.

**Tech Stack:** React 19, TypeScript 5, shadcn/ui, Supabase, canvas-confetti.

## Global Constraints

- pt-BR na interface
- Grid máximo 2 colunas: `grid-cols-1 sm:grid-cols-2`
- Imports com path alias `@/` → `src/`
- `FormDrawer` em `src/components/FormDrawer.tsx`
- `MetricCard` em `src/components/MetricCard.tsx`
- `SkeletonMetricCard`, `SkeletonTable` em `src/components/SkeletonLoader.tsx`
- `calcProfit(saleValue, milesUsed, costPerMile, additionalCost=0)`, `calcProfitMargin(profit, saleValue)`, `calcROI(profit, totalInvested)` em `src/lib/metrics.ts`
- Tipo `Sale` de `@/types`
- `formatCPF` em `@/lib/utils`
- Não adicionar testes (tarefa #10)
- Não alterar lógica de negócio

---

### Task 1: Criar `SaleMetrics.tsx`

**Files:**
- Create: `src/components/SaleMetrics.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { DollarSign, TrendingUp, Target, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetricCard } from "@/components/MetricCard"
import { calcProfitMargin } from "@/lib/metrics"
import type { Sale } from "@/types"

interface SaleMetricsProps {
  sales: Sale[]
  className?: string
}

export function SaleMetrics({ sales, className }: SaleMetricsProps) {
  const activeSales = sales.filter(s => s.status !== "cancelado")
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0)
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0)
  const totalMilesSold = activeSales.reduce((sum, s) => sum + s.milesUsed, 0)
  const margin = calcProfitMargin(totalProfit, totalRevenue)

  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300", className)}>
      <MetricCard title="Faturamento Total" value={totalRevenue} icon={DollarSign} prefix="R$" variant="default" />
      <MetricCard title="Lucro Total" value={totalProfit} icon={TrendingUp} prefix="R$" variant="success" />
      <MetricCard title="Milhas Vendidas" value={totalMilesSold.toLocaleString("pt-BR")} icon={Target} variant="default" />
      <MetricCard title="Margem Média" value={`${margin.toFixed(1)}%`} icon={Percent} variant="teal" />
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: Sem erros.

---

### Task 2: Criar `SaleSimulator.tsx`

**Files:**
- Create: `src/components/SaleSimulator.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { calcProfit, calcProfitMargin, calcROI } from "@/lib/metrics"

export interface StockItem {
  accountId: string
  ownerName: string
  accountName: string
  averageCostPerMile: number
}

interface SaleSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockInfo: StockItem[]
}

export function SaleSimulator({ open, onOpenChange, stockInfo }: SaleSimulatorProps) {
  const [inputs, setInputs] = useState({
    accountId: "",
    miles: "",
    pricePerMile: "",
    costPerMile: "",
    additionalCost: "",
  })

  const handleSelectAccount = (accountId: string) => {
    const account = stockInfo.find(s => s.accountId === accountId)
    setInputs(prev => ({ ...prev, accountId, costPerMile: account ? String(account.averageCostPerMile) : prev.costPerMile }))
  }

  const results = useMemo(() => {
    const miles = parseFloat(inputs.miles) || 0
    const price = parseFloat(inputs.pricePerMile) || 0
    const cost = parseFloat(inputs.costPerMile) || 0
    const addCost = parseFloat(inputs.additionalCost) || 0
    const saleValue = miles * price
    const totalCost = miles * cost + addCost
    return {
      saleValue,
      totalCost,
      profit: calcProfit(saleValue, miles, cost, addCost),
      margin: calcProfitMargin(calcProfit(saleValue, miles, cost, addCost), saleValue),
      roi: calcROI(calcProfit(saleValue, miles, cost, addCost), totalCost),
    }
  }, [inputs])

  const handleReset = () => setInputs({ accountId: "", miles: "", pricePerMile: "", costPerMile: "", additionalCost: "" })

  return (
    <FormDrawer open={open} onOpenChange={(open) => { if (!open) handleReset(); onOpenChange(open) }} title="Simulador de Venda">
      <div className="grid gap-4 py-4">
        <p className="text-sm text-muted-foreground">Calcule rapidamente o lucro e a margem de uma venda sem criar registro.</p>

        <div className="space-y-2">
          <Label>Conta (opcional — preenche custo automaticamente)</Label>
          <Select value={inputs.accountId} onValueChange={handleSelectAccount}>
            <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
            <SelectContent>
              {stockInfo.map(s => (
                <SelectItem key={s.accountId} value={s.accountId}>
                  {s.accountName} ({s.ownerName}) — R$ {s.averageCostPerMile.toFixed(4)}/milha
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simMiles">Milhas</Label>
            <Input id="simMiles" type="number" value={inputs.miles} onChange={e => setInputs(p => ({...p, miles: e.target.value}))} placeholder="Ex: 50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simPrice">Preço por Milha (R$)</Label>
            <Input id="simPrice" type="number" step="0.0001" value={inputs.pricePerMile} onChange={e => setInputs(p => ({...p, pricePerMile: e.target.value}))} placeholder="Ex: 0.03" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simCost">Custo por Milha (R$)</Label>
            <Input id="simCost" type="number" step="0.0001" value={inputs.costPerMile} onChange={e => setInputs(p => ({...p, costPerMile: e.target.value}))} placeholder="Ex: 0.07" />
            {inputs.accountId && <p className="text-xs text-muted-foreground">Preenchido automaticamente da conta</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="simAddCost">Custo Adicional (R$)</Label>
            <Input id="simAddCost" type="number" step="0.01" value={inputs.additionalCost} onChange={e => setInputs(p => ({...p, additionalCost: e.target.value}))} placeholder="Ex: 50.00" />
          </div>
        </div>

        {results.saleValue > 0 && (
          <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-3 animate-slide-up">
            <h4 className="font-semibold text-sm">Resultado da Simulação:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Valor da Venda:</span><p className="font-bold text-lg">R$ {results.saleValue.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Custo Total:</span><p className="font-semibold">R$ {results.totalCost.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Lucro:</span><p className={`font-bold text-lg ${results.profit >= 0 ? "text-success" : "text-destructive"}`}>{results.profit >= 0 ? "+" : ""}R$ {results.profit.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Margem:</span><p className={`font-bold text-lg ${results.margin >= 0 ? "text-success" : "text-destructive"}`}>{results.margin.toFixed(1)}%</p></div>
              <div className="col-span-2"><span className="text-muted-foreground text-xs">ROI:</span><p className={`font-bold text-lg ${results.roi >= 0 ? "text-success" : "text-destructive"}`}>{results.roi.toFixed(1)}%</p></div>
            </div>
          </div>
        )}

        {parseFloat(inputs.miles) > 0 && results.saleValue === 0 && (
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
            Preencha o preço por milha para ver os resultados
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
```

Note: `results` calls `calcProfit` 3x in the useMemo — this is fine for a form, no perf concern. If it bothers you, extract to a local `const profit = calcProfit(...)` before building the return object.

- [ ] **Step 2: Verificar build**

---

### Task 3: Criar `SaleTable.tsx`

**Files:**
- Create: `src/components/SaleTable.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState } from "react"
import { Package, TrendingDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/EmptyState"
import type { Sale } from "@/types"

interface SaleTableProps {
  sales: Sale[]
  onCancel?: (saleId: string) => void
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void
}

export function SaleTable({ sales, onCancel, onStatusChange }: SaleTableProps) {
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  if (sales.length === 0) {
    return (
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" />Histórico de Vendas</CardTitle></CardHeader>
        <CardContent>
          <div className="py-8"><EmptyState icon={Package} title="Nenhuma venda encontrada" description="Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer." /></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" />Histórico de Vendas</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dono/Programa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Milhas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => (
                  <TableRow key={sale.id} className={sale.status === "cancelado" ? "opacity-50" : ""}>
                    <TableCell>{new Date(sale.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><p className="font-medium">{sale.ownerName}</p><p className="text-xs text-muted-foreground">{sale.program}</p></TableCell>
                    <TableCell><p className="font-medium">{sale.clientName}</p><p className="text-xs text-muted-foreground">{sale.ticketLocator}</p></TableCell>
                    <TableCell>{sale.milesUsed.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>R$ {sale.saleValue.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>R$ {sale.profit.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{sale.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell>
                      {sale.status === "cancelado" ? (
                        <Badge variant="outline" className="text-destructive border-destructive">Cancelado</Badge>
                      ) : (
                        <Select value={sale.status} onValueChange={v => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                          <SelectTrigger className="w-28">
                            <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{sale.passengers.length} pax</span>
                        {sale.status !== "cancelado" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-6 text-xs" onClick={() => setCancelConfirmId(sale.id)}>Cancelar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {sales.map(sale => (
              <div key={sale.id} className={`border rounded-lg p-4 space-y-3 ${sale.status === "cancelado" ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{sale.program}</p>
                    <p className="text-xs text-muted-foreground truncate">{sale.ownerName} • {new Date(sale.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {sale.status === "cancelado"
                    ? <Badge variant="outline" className="text-destructive border-destructive shrink-0 ml-2">Cancelado</Badge>
                    : <Badge variant="outline" className={`shrink-0 ml-2 ${sale.status === "pendente" ? "text-warning border-warning" : sale.status === "pago" ? "text-primary border-primary" : "text-success border-success"}`}>{sale.status === "pendente" ? "Pendente" : sale.status === "pago" ? "Pago" : "Concluído"}</Badge>
                  }
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Cliente:</span><p className="font-semibold truncate">{sale.clientName}</p></div>
                  <div><span className="text-muted-foreground text-xs">Milhas:</span><p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Valor:</span><p className="font-semibold">R$ {sale.saleValue.toLocaleString("pt-BR")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Lucro:</span><p className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>R$ {sale.profit.toLocaleString("pt-BR")}</p></div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {sale.ticketLocator && <span className="truncate">Localizador: {sale.ticketLocator}</span>}
                    <span className="flex items-center gap-1 shrink-0"><Users className="h-3 w-3" />{sale.passengers.length} pax</span>
                  </div>
                </div>
                {sale.status !== "cancelado" && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]" onClick={() => setCancelConfirmId(sale.id)}>Cancelar</Button>
                    <div className="flex-1">
                      <Select value={sale.status} onValueChange={v => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                        <SelectTrigger className="w-full min-h-[44px]">
                          <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelConfirmId} onOpenChange={open => { if (!open) setCancelConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (cancelConfirmId) { onCancel?.(cancelConfirmId); setCancelConfirmId(null) } }}>Sim, cancelar venda</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 4: Criar `SaleForm.tsx`

**Files:**
- Create: `src/components/SaleForm.tsx`

**Interface:**
```tsx
interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  sales: Sale[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}
```

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { formatCPF } from "@/lib/utils"
import { calcProfit, calcProfitMargin } from "@/lib/metrics"
import type { Account, Owner, Program, Client, Sale } from "@/types"

export interface SaleFormData {
  ownerName: string
  accountId: string
  accountName: string
  program: string
  clientId: string
  clientName: string
  milesUsed: string
  pricePerMile: string
  saleValue: string
  additionalCost: string
  additionalCostDesc: string
  ticketLocator: string
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
}

interface NewClientData {
  name: string; cpf: string; email: string; phone: string; telegram: string
}

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  sales: Sale[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}

const emptyPassenger = () => ({ name: "", passengerId: crypto.randomUUID(), cpf: "", clientId: undefined as string | undefined })

const emptyForm: SaleFormData = {
  ownerName: "", accountId: "", accountName: "", program: "",
  clientId: "", clientName: "", milesUsed: "", pricePerMile: "",
  saleValue: "", additionalCost: "", additionalCostDesc: "",
  ticketLocator: "", passengers: [emptyPassenger()],
}

export function SaleForm({ open, onOpenChange, accounts, owners, programs, clients, sales, onSubmit, onCreateClient }: SaleFormProps) {
  const [form, setForm] = useState<SaleFormData>(emptyForm)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState<NewClientData>({ name: "", cpf: "", email: "", phone: "", telegram: "" })
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({})

  // Derived data
  const stockInfo = useMemo(() =>
    accounts.filter(a => a.type === "milhas" && a.status === "ativa").map(a => ({
      accountId: a.id, ownerId: a.ownerId,
      ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
      accountName: a.name, programId: a.programId,
      program: programs.find(p => p.id === a.programId)?.name ?? "",
      availableMiles: a.balance, averageCostPerMile: a.averageCostPerMile ?? 0,
    })), [accounts, owners, programs])

  const ownersList = useMemo(() => [...new Set(stockInfo.map(s => s.ownerName))], [stockInfo])
  const selectedOwnerStock = useMemo(() => stockInfo.filter(s => s.ownerName === form.ownerName), [stockInfo, form.ownerName])
  const selectedProgramStock = useMemo(() => stockInfo.find(s => s.accountId === form.accountId), [stockInfo, form.accountId])
  const programConfig = useMemo(() => programs.find(p => p.id === selectedProgramStock?.programId), [programs, selectedProgramStock])

  // Passenger cycle validation
  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0
    let relevant = sales.filter(s => s.program === form.program)
    if (programConfig.passengerCycleType === "anual") {
      const year = new Date().getFullYear()
      relevant = relevant.filter(s => new Date(s.date).getFullYear() === year)
    } else if (programConfig.passengerCycleType === "dias" && programConfig.passengerCycleDays) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - programConfig.passengerCycleDays)
      cutoff.setHours(0, 0, 0, 0)
      relevant = relevant.filter(s => new Date(s.date) >= cutoff)
    }
    return relevant.reduce((sum, s) => sum + s.passengers.length, 0)
  }, [sales, form.program, programConfig])

  // Profit preview
  const profitPreview = useMemo(() => {
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null
    const miles = parseFloat(form.milesUsed)
    const val = parseFloat(form.saleValue)
    const addCost = parseFloat(form.additionalCost || "0")
    const costPM = selectedProgramStock.averageCostPerMile
    const profit = calcProfit(val, miles, costPM, addCost)
    return { costTotal: miles * costPM, profit, margin: calcProfitMargin(profit, val) }
  }, [form.milesUsed, form.saleValue, form.additionalCost, selectedProgramStock])

  const update = (partial: Partial<SaleFormData>) => setForm(prev => ({ ...prev, ...partial }))

  const handleSubmit = () => { onSubmit(form); setForm(emptyForm) }

  const handleCreateClient = () => {
    if (!newClient.name.trim()) { setClientErrors({ name: "Nome é obrigatório" }); return }
    const id = crypto.randomUUID()
    onCreateClient({ id, ...newClient })
    update({ clientId: id, clientName: newClient.name.trim() })
    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" })
    setClientErrors({})
    setIsClientDialogOpen(false)
  }

  const canSubmit = form.ownerName && form.accountId && form.program && form.clientId && form.milesUsed && form.saleValue &&
    (!selectedProgramStock || parseFloat(form.milesUsed) <= selectedProgramStock.availableMiles)

  const passengerLimitExceeded = programConfig?.maxPassengers && usedPassengersInCycle + form.passengers.filter(p => p.name.trim()).length > programConfig.maxPassengers

  return (
    <>
      <FormDrawer open={open} onOpenChange={open => { if (!open) setForm(emptyForm); onOpenChange(open) }} title="Registrar Nova Venda">
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">

          {/* Owner + Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dono da Conta</Label>
              <Select value={form.ownerName} onValueChange={v => update({ ownerName: v, accountId: "", accountName: "", program: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecione o dono" /></SelectTrigger>
                <SelectContent>{ownersList.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta / Programa</Label>
              <Select value={form.accountId} onValueChange={v => { const s = selectedOwnerStock.find(x => x.accountId === v); update({ accountId: v, accountName: s?.accountName ?? "", program: s?.program ?? "" }) }} disabled={!form.ownerName}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>{selectedOwnerStock.map(s => <SelectItem key={s.accountId} value={s.accountId}>{s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")} milhas)</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock info */}
          {selectedProgramStock && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-muted-foreground">Milhas disponíveis:</span><p className="font-semibold">{selectedProgramStock.availableMiles.toLocaleString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Custo médio por milha:</span><p className="font-semibold">R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}</p></div>
              </div>
            </div>
          )}

          {/* Client + Locator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={form.clientId} onValueChange={v => { const c = clients.find(x => x.id === v); update({ clientId: v, clientName: c?.name || "" }) }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} title="Novo cliente"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localizador do Bilhete</Label>
              <Input value={form.ticketLocator} onChange={e => update({ ticketLocator: e.target.value })} placeholder="Ex: ABC123" />
            </div>
          </div>

          {/* Miles + Price + Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Milhas Utilizadas</Label>
              <Input type="number" value={form.milesUsed} onChange={e => {
                const v = e.target.value
                update(v && form.pricePerMile ? { milesUsed: v, saleValue: (parseFloat(v) * parseFloat(form.pricePerMile)).toFixed(2) } : { milesUsed: v })
              }} placeholder="Ex: 50000" max={selectedProgramStock?.availableMiles} />
              {selectedProgramStock && <p className="text-xs text-muted-foreground">Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas</p>}
              {form.milesUsed && selectedProgramStock && parseFloat(form.milesUsed) > selectedProgramStock.availableMiles && (
                <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor por Milha (R$)</Label>
              <Input type="number" step="0.0001" value={form.pricePerMile} onChange={e => {
                const v = e.target.value
                update(v && form.milesUsed ? { pricePerMile: v, saleValue: (parseFloat(v) * parseFloat(form.milesUsed)).toFixed(2) } : { pricePerMile: v })
              }} placeholder="Ex: 0.03" />
            </div>
            <div className="space-y-2">
              <Label>Valor da Venda (R$)</Label>
              <Input type="number" step="0.01" value={form.saleValue} onChange={e => update({ saleValue: e.target.value })} placeholder="Ex: 300.00" />
              {form.pricePerMile && form.milesUsed && <p className="text-xs text-muted-foreground">{parseFloat(form.milesUsed).toLocaleString("pt-BR")} × R$ {parseFloat(form.pricePerMile).toFixed(4)}</p>}
            </div>
          </div>

          {/* Additional Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo Adicional (R$)</Label>
              <Input type="number" step="0.01" value={form.additionalCost} onChange={e => update({ additionalCost: e.target.value })} placeholder="Ex: 50.00" />
            </div>
            <div className="space-y-2">
              <Label>Observação do Custo</Label>
              <Input value={form.additionalCostDesc} onChange={e => update({ additionalCostDesc: e.target.value })} placeholder="Ex: Taxa de embarque" />
            </div>
          </div>

          {/* Profit Preview via calcProfit / calcProfitMargin */}
          {profitPreview && (
            <div className="p-3 bg-success-light rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-muted-foreground">Custo total:</span><p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p></div>
                {form.additionalCost && parseFloat(form.additionalCost) > 0 && (
                  <div><span className="text-muted-foreground">Custo adicional:</span><p className="font-semibold text-destructive">R$ {parseFloat(form.additionalCost).toFixed(2)}</p></div>
                )}
                <div><span className="text-muted-foreground">Lucro:</span><p className="font-semibold text-success">R$ {profitPreview.profit.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Margem:</span><p className="font-semibold">{profitPreview.margin.toFixed(1)}%</p></div>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Passageiros no Bilhete</Label>
              <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={() => update({ passengers: [...form.passengers, emptyPassenger()] })}>Adicionar</Button>
            </div>
            {form.passengers.map((p, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                <Select value={p.clientId ?? ""} onValueChange={v => {
                  if (v === "__manual__") {
                    const upd = form.passengers.map((x, j) => j === i ? { ...x, clientId: undefined, name: "", cpf: "" } : x)
                    update({ passengers: upd })
                  } else {
                    const client = clients.find(c => c.id === v)
                    if (client) {
                      const upd = form.passengers.map((x, j) => j === i ? { ...x, clientId: client.id, name: client.name, cpf: client.cpf ?? x.cpf } : x)
                      update({ passengers: upd })
                    }
                  }
                }}>
                  <SelectTrigger className="w-24 text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">— Manual —</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Nome completo" value={p.name} onChange={e => update({ passengers: form.passengers.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                <Input placeholder="ID Passageiro" value={p.passengerId} disabled className="bg-muted/30 text-muted-foreground text-xs" />
                <Input placeholder="CPF" value={p.cpf} onChange={e => update({ passengers: form.passengers.map((x, j) => j === i ? { ...x, cpf: e.target.value } : x) })} />
                {form.passengers.length > 1 && (
                  <Button type="button" size="sm" variant="outline" className="min-h-[44px] min-w-[44px]" onClick={() => update({ passengers: form.passengers.filter((_, j) => j !== i) })}>×</Button>
                )}
              </div>
            ))}
          </div>

          {passengerLimitExceeded && (
            <p className="text-xs text-destructive">
              Limite de {programConfig!.maxPassengers} passageiros excedido para este ciclo.
              Usados: {usedPassengersInCycle} + {form.passengers.filter(p => p.name.trim()).length} novo(s) = {usedPassengersInCycle + form.passengers.filter(p => p.name.trim()).length}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90" disabled={!canSubmit || !!passengerLimitExceeded}>Registrar Venda</Button>
        </div>
      </FormDrawer>

      {/* Client creation dialog */}
      <FormDrawer open={isClientDialogOpen} onOpenChange={open => { setIsClientDialogOpen(open); if (!open) setClientErrors({}) }} title="Novo Cliente">
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={newClient.name} onChange={e => { setNewClient(p => ({...p, name: e.target.value})); setClientErrors(prev => ({...prev, name: ""})) }} placeholder="Digite o nome completo" />
            {clientErrors.name && <p className="text-xs text-destructive">{clientErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={newClient.cpf} onChange={e => setNewClient(p => ({...p, cpf: formatCPF(e.target.value.replace(/\D/g, "").slice(0, 11))}))} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({...p, email: e.target.value}))} placeholder="cliente@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={newClient.phone} onChange={e => setNewClient(p => ({...p, phone: e.target.value}))} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Contato Telegram</Label>
            <Input value={newClient.telegram} onChange={e => setNewClient(p => ({...p, telegram: e.target.value}))} placeholder="@usuario" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setIsClientDialogOpen(false); setClientErrors({}) }}>Cancelar</Button>
          <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">Cadastrar</Button>
        </div>
      </FormDrawer>
    </>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 5: Refatorar `Vendas.tsx`

**Files:**
- Modify: `src/pages/Vendas.tsx` — substituir blocos inline pelos 4 componentes + import calcProfit/calcProfitMargin/calcROI

**What changes:**
1. Add imports: `SaleMetrics`, `SaleForm`, `SaleTable`, `SaleSimulator`, `StockItem`, `SaleFormData`
2. Add import: `calcProfit`, `calcProfitMargin`, `calcROI` from `@/lib/metrics`
3. Remove ~700 lines of inline form/table/simulator JSX and their state/logic
4. Keep: data fetching, filters, mutations, orchestration

- [ ] **Step 1: Editar Vendas.tsx**

Replace the entire file content with the refactored version:

```tsx
import { useState, useMemo } from "react"
import { Plus, Search, Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader"
import { useDebounce } from "@/hooks/useDebounce"
import { useHaptic } from "@/hooks/useHaptic"
import { useData } from "@/contexts/DataContext"
import { useAddSaleMutation, useCancelSaleMutation, useAddClientMutation } from "@/hooks/useDatabase"
import { calcProfit, calcProfitMargin } from "@/lib/metrics"
import { SaleMetrics } from "@/components/SaleMetrics"
import { SaleForm, type SaleFormData } from "@/components/SaleForm"
import { SaleTable } from "@/components/SaleTable"
import { SaleSimulator, type StockItem } from "@/components/SaleSimulator"
import confetti from "canvas-confetti"
import type { Sale } from "@/types"

export default function Vendas() {
  const { clients, accounts, owners, programs, sales, isLoading } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const addSaleM = useAddSaleMutation()
  const cancelSaleM = useCancelSaleMutation()
  const addClientM = useAddClientMutation()
  const haptic = useHaptic()

  // Derived stock info (shared with SaleSimulator)
  const stockInfo: StockItem[] = useMemo(() =>
    accounts.filter(a => a.type === "milhas" && a.status === "ativa").map(a => ({
      accountId: a.id,
      ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
      accountName: a.name,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    })), [accounts, owners])

  // Handlers
  const handleCreateSale = (data: SaleFormData) => {
    const milesUsed = parseFloat(data.milesUsed)
    const saleValue = parseFloat(data.saleValue)
    const additionalCost = parseFloat(data.additionalCost || "0")
    const milesCost = parseFloat(data.pricePerMile || "0") * milesUsed
    const costPerMile = parseFloat(data.pricePerMile || "0")
    const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost)
    const profitMargin = calcProfitMargin(profit, saleValue)

    addSaleM.mutate(
      {
        id: crypto.randomUUID(),
        accountId: data.accountId,
        ownerName: data.ownerName,
        accountName: data.accountName,
        program: data.program,
        clientId: data.clientId,
        clientName: data.clientName,
        milesUsed,
        saleValue,
        pricePerMile: costPerMile || undefined,
        additionalCost: additionalCost || undefined,
        additionalCostDesc: data.additionalCostDesc.trim() || undefined,
        costPerMile,
        profit,
        profitMargin,
        status: "pendente" as const,
        ticketLocator: data.ticketLocator,
        passengers: data.passengers.filter(p => p.name.trim()),
        date: new Date().toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          haptic.success()
          if (saleValue >= 200) {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#6366f1", "#f59e0b", "#10b981"] })
          }
        },
      },
    )
    setIsCreateDialogOpen(false)
  }

  const handleCancelSale = (saleId: string) => {
    cancelSaleM.mutate(saleId)
  }

  const handleStatusChange = (saleId: string, status: "pendente" | "pago" | "concluido") => {
    // Using a direct update approach — adjust if useUpdateSaleMutation is available
    // For now, this is a placeholder. The actual implementation may need useUpdateSaleMutation
    // ponytail: inline update via mutation — extract if status changes grow
    const { useUpdateSaleMutation } = require("@/hooks/useDatabase")
    // Actually, import it at the top level
  }

  const handleCreateClient = (data: { id: string; name: string; cpf: string; email: string; phone: string; telegram: string }) => {
    addClientM.mutate({
      id: data.id,
      name: data.name.trim(),
      cpf: data.cpf,
      email: data.email.trim(),
      phone: data.phone,
      telegram: data.telegram,
      totalPurchases: 0,
      usageHistory: [],
    })
  }

  // Filters
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (statusFilter !== "todos" && s.status !== statusFilter) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return s.clientName.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q) || s.ticketLocator.toLowerCase().includes(q)
    })
  }, [sales, statusFilter, debouncedSearch])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas de Milhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as vendas de milhas e controle de estoque por dono</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9 w-full sm:w-56" placeholder="Buscar venda..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={() => setSimulatorOpen(true)}>
              <Calculator className="h-4 w-4" />Simular
            </Button>
            <Button className="flex-1 sm:flex-none gap-2 bg-gradient-primary hover:opacity-90" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />Nova Venda
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <SaleMetrics sales={sales} />

      {/* Sales Table */}
      <SaleTable
        sales={filteredSales}
        onCancel={handleCancelSale}
        onStatusChange={handleStatusChange}
      />

      {/* Create Sale Form */}
      <SaleForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        accounts={accounts}
        owners={owners}
        programs={programs}
        clients={clients}
        sales={sales}
        onSubmit={handleCreateSale}
        onCreateClient={handleCreateClient}
      />

      {/* Simulator */}
      <SaleSimulator
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        stockInfo={stockInfo}
      />
    </div>
  )
}
```

Wait — there's a problem with `handleStatusChange`. In the original code, it uses `updateSaleM.mutate({ id, status })`. I need to import `useUpdateSaleMutation`. Let me fix the import.

Also, the `handleCreateSale` in the original calculates `costPerMile` from `selectedProgramStock.averageCostPerMile`, not from `pricePerMile`. Let me re-check the original:

```tsx
const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
```

So `costPerMile` comes from the stock info (average cost per mile from the account), not from the form. And `pricePerMile` is the sale's price per mile. Let me fix this.

Actually wait - looking at the form data, `data.pricePerMile` is the price charged per mile to the client, while `costPerMile` is the cost the seller incurred. In the original:

```tsx
const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
```

But in the extracted SaleForm, the stock info is computed internally. The parent receives `SaleFormData` which doesn't include `costPerMile` — it uses `pricePerMile` (sale price per mile) and the cost is derived from the account's average cost.

Hmm, but the original `handleCreateSale` uses `selectedProgramStock?.averageCostPerMile` which is the account's stored cost. In the refactored Vendas.tsx, we don't have access to `selectedProgramStock` anymore since that was internal to the form.

I have two options:
1. Include `costPerMile` in `SaleFormData` and populate it from the stock info inside SaleForm
2. Compute costPerMile in the parent from `accounts` data

Option 1 is better — the SaleForm already computes `selectedProgramStock`, so it can add `costPerMile` to the submitted data.

Let me update `SaleFormData` to include `costPerMile: number` and populate it on submit. And update `handleCreateSale` accordingly.

Let me also fix the `handleStatusChange` to properly import `useUpdateSaleMutation`.

OK, let me fix these in the plan. I'll rewrite Task 5 properly.

Note: I also need to make sure `handleCreateSale` passes `costPerMile` properly. Let me adjust:

In SaleForm, when calling `onSubmit`, include `costPerMile` in the data:
```tsx
const handleSubmit = () => {
  const costPerMile = selectedProgramStock?.averageCostPerMile ?? 0
  onSubmit({ ...form, costPerMile })
  setForm(emptyForm)
}
```

And in SaleFormData, add:
```tsx
export interface SaleFormData {
  // ... existing fields
  costPerMile?: number  // filled on submit
}
```

Wait, but `SaleFormData` is used as the form state type. Adding `costPerMile` to it means resetting it on form clear too. Let me just make it a number that defaults to 0.

Actually, the simpler approach: the parent can compute `costPerMile` from `accounts` and the submitted `accountId`. Or I can just pass it from the form on submit without adding it to the form state.

The cleanest: keep `SaleFormData` as the form state (user-facing), and on submit compute `costPerMile` internally inside SaleForm and attach it:

```tsx
const handleSubmit = () => {
  const costPerMile = selectedProgramStock?.averageCostPerMile ?? 0
  onSubmit({ ...form, costPerMile })
  setForm(emptyForm)
}
```

This means `SaleFormData` has an optional `costPerMile` for the submit flow. The form state itself doesn't include it (user doesn't type it). Let me update the interface.

Let me fix the plan now.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Extração de Vendas.tsx — Plano de Implementação

> **For agentic workers:** Use inline execution (executing-plans) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extrair 4 componentes de `src/pages/Vendas.tsx` (1117 linhas → ~300), eliminar cálculos inline usando `calcProfit`/`calcProfitMargin`/`calcROI` de `src/lib/metrics.ts`.

**Architecture:** Seguir exatamente o padrão do #6 (Entradas). Componentes em `src/components/` com props tipadas. Página orquestradora mantém só estado global + filtros + mutations.

**Tech Stack:** React 19, TypeScript 5, shadcn/ui, Supabase, canvas-confetti.

## Global Constraints

- pt-BR na interface
- Grid máximo 2 colunas: `grid-cols-1 sm:grid-cols-2`
- Imports com path alias `@/` → `src/`
- `FormDrawer` em `src/components/FormDrawer.tsx`
- `MetricCard` em `src/components/MetricCard.tsx`
- `SkeletonMetricCard`, `SkeletonTable` em `src/components/SkeletonLoader.tsx`
- `calcProfit(saleValue, milesUsed, costPerMile, additionalCost=0)`, `calcProfitMargin(profit, saleValue)`, `calcROI(profit, totalInvested)` em `src/lib/metrics.ts`
- Tipo `Sale` de `@/types`
- `formatCPF` em `@/lib/utils`
- Não adicionar testes (tarefa #10)
- Não alterar lógica de negócio

---

### Task 1: Criar `SaleMetrics.tsx`

**Files:**
- Create: `src/components/SaleMetrics.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { DollarSign, TrendingUp, Target, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetricCard } from "@/components/MetricCard"
import { calcProfitMargin } from "@/lib/metrics"
import type { Sale } from "@/types"

interface SaleMetricsProps {
  sales: Sale[]
  className?: string
}

export function SaleMetrics({ sales, className }: SaleMetricsProps) {
  const activeSales = sales.filter(s => s.status !== "cancelado")
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.saleValue, 0)
  const totalProfit = activeSales.reduce((sum, s) => sum + s.profit, 0)
  const totalMilesSold = activeSales.reduce((sum, s) => sum + s.milesUsed, 0)
  const margin = calcProfitMargin(totalProfit, totalRevenue)

  return (
    <div className={cn("grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300", className)}>
      <MetricCard title="Faturamento Total" value={totalRevenue} icon={DollarSign} prefix="R$" variant="default" />
      <MetricCard title="Lucro Total" value={totalProfit} icon={TrendingUp} prefix="R$" variant="success" />
      <MetricCard title="Milhas Vendidas" value={totalMilesSold.toLocaleString("pt-BR")} icon={Target} variant="default" />
      <MetricCard title="Margem Média" value={`${margin.toFixed(1)}%`} icon={Percent} variant="teal" />
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

### Task 2: Criar `SaleSimulator.tsx`

**Files:**
- Create: `src/components/SaleSimulator.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { calcProfit, calcProfitMargin, calcROI } from "@/lib/metrics"

export interface StockItem {
  accountId: string
  ownerName: string
  accountName: string
  averageCostPerMile: number
}

interface SaleSimulatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockInfo: StockItem[]
}

export function SaleSimulator({ open, onOpenChange, stockInfo }: SaleSimulatorProps) {
  const [inputs, setInputs] = useState({
    accountId: "", miles: "", pricePerMile: "", costPerMile: "", additionalCost: "",
  })

  const handleSelectAccount = (accountId: string) => {
    const account = stockInfo.find(s => s.accountId === accountId)
    setInputs(prev => ({ ...prev, accountId, costPerMile: account ? String(account.averageCostPerMile) : prev.costPerMile }))
  }

  const results = useMemo(() => {
    const miles = parseFloat(inputs.miles) || 0
    const price = parseFloat(inputs.pricePerMile) || 0
    const cost = parseFloat(inputs.costPerMile) || 0
    const addCost = parseFloat(inputs.additionalCost) || 0
    const saleValue = miles * price
    const totalCost = miles * cost + addCost
    const profit = calcProfit(saleValue, miles, cost, addCost)
    return { saleValue, totalCost, profit, margin: calcProfitMargin(profit, saleValue), roi: calcROI(profit, totalCost) }
  }, [inputs])

  const handleReset = () => setInputs({ accountId: "", miles: "", pricePerMile: "", costPerMile: "", additionalCost: "" })

  return (
    <FormDrawer open={open} onOpenChange={(open) => { if (!open) handleReset(); onOpenChange(open) }} title="Simulador de Venda">
      <div className="grid gap-4 py-4">
        <p className="text-sm text-muted-foreground">Calcule rapidamente o lucro e a margem de uma venda sem criar registro.</p>

        <div className="space-y-2">
          <Label>Conta (opcional — preenche custo automaticamente)</Label>
          <Select value={inputs.accountId} onValueChange={handleSelectAccount}>
            <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
            <SelectContent>
              {stockInfo.map(s => (
                <SelectItem key={s.accountId} value={s.accountId}>
                  {s.accountName} ({s.ownerName}) — R$ {s.averageCostPerMile.toFixed(4)}/milha
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simMiles">Milhas</Label>
            <Input id="simMiles" type="number" value={inputs.miles} onChange={e => setInputs(p => ({...p, miles: e.target.value}))} placeholder="Ex: 50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simPrice">Preço por Milha (R$)</Label>
            <Input id="simPrice" type="number" step="0.0001" value={inputs.pricePerMile} onChange={e => setInputs(p => ({...p, pricePerMile: e.target.value}))} placeholder="Ex: 0.03" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="simCost">Custo por Milha (R$)</Label>
            <Input id="simCost" type="number" step="0.0001" value={inputs.costPerMile} onChange={e => setInputs(p => ({...p, costPerMile: e.target.value}))} placeholder="Ex: 0.07" />
            {inputs.accountId && <p className="text-xs text-muted-foreground">Preenchido automaticamente da conta</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="simAddCost">Custo Adicional (R$)</Label>
            <Input id="simAddCost" type="number" step="0.01" value={inputs.additionalCost} onChange={e => setInputs(p => ({...p, additionalCost: e.target.value}))} placeholder="Ex: 50.00" />
          </div>
        </div>

        {results.saleValue > 0 && (
          <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-3 animate-slide-up">
            <h4 className="font-semibold text-sm">Resultado da Simulação:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Valor da Venda:</span><p className="font-bold text-lg">R$ {results.saleValue.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Custo Total:</span><p className="font-semibold">R$ {results.totalCost.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Lucro:</span><p className={`font-bold text-lg ${results.profit >= 0 ? "text-success" : "text-destructive"}`}>{results.profit >= 0 ? "+" : ""}R$ {results.profit.toFixed(2)}</p></div>
              <div><span className="text-muted-foreground text-xs">Margem:</span><p className={`font-bold text-lg ${results.margin >= 0 ? "text-success" : "text-destructive"}`}>{results.margin.toFixed(1)}%</p></div>
              <div className="col-span-2"><span className="text-muted-foreground text-xs">ROI:</span><p className={`font-bold text-lg ${results.roi >= 0 ? "text-success" : "text-destructive"}`}>{results.roi.toFixed(1)}%</p></div>
            </div>
          </div>
        )}

        {parseFloat(inputs.miles) > 0 && results.saleValue === 0 && (
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
            Preencha o preço por milha para ver os resultados
          </div>
        )}
      </div>
    </FormDrawer>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 3: Criar `SaleTable.tsx`

**Files:**
- Create: `src/components/SaleTable.tsx`

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState } from "react"
import { Package, TrendingDown, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { EmptyState } from "@/components/EmptyState"
import type { Sale } from "@/types"

interface SaleTableProps {
  sales: Sale[]
  onCancel?: (saleId: string) => void
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void
}

export function SaleTable({ sales, onCancel, onStatusChange }: SaleTableProps) {
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  if (sales.length === 0) {
    return (
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" />Histórico de Vendas</CardTitle></CardHeader>
        <CardContent>
          <div className="py-8"><EmptyState icon={Package} title="Nenhuma venda encontrada" description="Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer." /></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-primary" />Histórico de Vendas</CardTitle></CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Dono/Programa</TableHead><TableHead>Cliente</TableHead>
                  <TableHead>Milhas</TableHead><TableHead>Valor</TableHead><TableHead>Lucro</TableHead>
                  <TableHead>Margem</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => (
                  <TableRow key={sale.id} className={sale.status === "cancelado" ? "opacity-50" : ""}>
                    <TableCell>{new Date(sale.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><p className="font-medium">{sale.ownerName}</p><p className="text-xs text-muted-foreground">{sale.program}</p></TableCell>
                    <TableCell><p className="font-medium">{sale.clientName}</p><p className="text-xs text-muted-foreground">{sale.ticketLocator}</p></TableCell>
                    <TableCell>{sale.milesUsed.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{"R$ "}{sale.saleValue.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>{"R$ "}{sale.profit.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{sale.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell>
                      {sale.status === "cancelado" ? (
                        <Badge variant="outline" className="text-destructive border-destructive">Cancelado</Badge>
                      ) : (
                        <Select value={sale.status} onValueChange={v => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                          <SelectTrigger className="w-28">
                            <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" /><span className="text-xs">{sale.passengers.length} pax</span>
                        {sale.status !== "cancelado" && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-6 text-xs" onClick={() => setCancelConfirmId(sale.id)}>Cancelar</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {sales.map(sale => (
              <div key={sale.id} className={`border rounded-lg p-4 space-y-3 ${sale.status === "cancelado" ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{sale.program}</p>
                    <p className="text-xs text-muted-foreground truncate">{sale.ownerName} • {new Date(sale.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {sale.status === "cancelado"
                    ? <Badge variant="outline" className="text-destructive border-destructive shrink-0 ml-2">Cancelado</Badge>
                    : <Badge variant="outline" className={`shrink-0 ml-2 ${sale.status === "pendente" ? "text-warning border-warning" : sale.status === "pago" ? "text-primary border-primary" : "text-success border-success"}`}>{sale.status === "pendente" ? "Pendente" : sale.status === "pago" ? "Pago" : "Concluído"}</Badge>
                  }
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground text-xs">Cliente:</span><p className="font-semibold truncate">{sale.clientName}</p></div>
                  <div><span className="text-muted-foreground text-xs">Milhas:</span><p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Valor:</span><p className="font-semibold">{"R$ "}{sale.saleValue.toLocaleString("pt-BR")}</p></div>
                  <div><span className="text-muted-foreground text-xs">Lucro:</span><p className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}>{"R$ "}{sale.profit.toLocaleString("pt-BR")}</p></div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {sale.ticketLocator && <span className="truncate">Localizador: {sale.ticketLocator}</span>}
                    <span className="flex items-center gap-1 shrink-0"><Users className="h-3 w-3" />{sale.passengers.length} pax</span>
                  </div>
                </div>
                {sale.status !== "cancelado" && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]" onClick={() => setCancelConfirmId(sale.id)}>Cancelar</Button>
                    <div className="flex-1">
                      <Select value={sale.status} onValueChange={v => onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")}>
                        <SelectTrigger className="w-full min-h-[44px]">
                          <span className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelConfirmId} onOpenChange={open => { if (!open) setCancelConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => { if (cancelConfirmId) { onCancel?.(cancelConfirmId); setCancelConfirmId(null) } }}>Sim, cancelar venda</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 4: Criar `SaleForm.tsx`

**Files:**
- Create: `src/components/SaleForm.tsx`

**Interface:**
```tsx
interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  sales: Sale[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}
```

`SaleFormData` tem todos os campos do formulário + `costPerMile` (preenchido no submit a partir do estoque selecionado).

- [ ] **Step 1: Escrever o arquivo**

```tsx
import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { formatCPF } from "@/lib/utils"
import { calcProfit, calcProfitMargin } from "@/lib/metrics"
import type { Account, Owner, Program, Client, Sale } from "@/types"

export interface SaleFormData {
  ownerName: string
  accountId: string
  accountName: string
  program: string
  clientId: string
  clientName: string
  milesUsed: string
  pricePerMile: string
  saleValue: string
  additionalCost: string
  additionalCostDesc: string
  ticketLocator: string
  passengers: { name: string; passengerId: string; cpf: string; clientId?: string }[]
  /** Preenchido automaticamente no submit a partir do averageCostPerMile da conta */
  costPerMile?: number
}

interface NewClientData {
  name: string; cpf: string; email: string; phone: string; telegram: string
}

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  owners: Owner[]
  programs: Program[]
  clients: Client[]
  sales: Sale[]
  onSubmit: (data: SaleFormData) => void
  onCreateClient: (data: NewClientData & { id: string }) => void
}

const emptyPassenger = () => ({ name: "", passengerId: crypto.randomUUID(), cpf: "", clientId: undefined as string | undefined })

const emptyForm: SaleFormData = {
  ownerName: "", accountId: "", accountName: "", program: "",
  clientId: "", clientName: "", milesUsed: "", pricePerMile: "",
  saleValue: "", additionalCost: "", additionalCostDesc: "",
  ticketLocator: "", passengers: [emptyPassenger()],
}

export function SaleForm({ open, onOpenChange, accounts, owners, programs, clients, sales, onSubmit, onCreateClient }: SaleFormProps) {
  const [form, setForm] = useState<SaleFormData>(emptyForm)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [newClient, setNewClient] = useState<NewClientData>({ name: "", cpf: "", email: "", phone: "", telegram: "" })
  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({})

  // Derived data
  const stockInfo = useMemo(() =>
    accounts.filter(a => a.type === "milhas" && a.status === "ativa").map(a => ({
      accountId: a.id, ownerId: a.ownerId,
      ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
      accountName: a.name, programId: a.programId,
      program: programs.find(p => p.id === a.programId)?.name ?? "",
      availableMiles: a.balance, averageCostPerMile: a.averageCostPerMile ?? 0,
    })), [accounts, owners, programs])

  const ownersList = useMemo(() => [...new Set(stockInfo.map(s => s.ownerName))], [stockInfo])
  const selectedOwnerStock = useMemo(() => stockInfo.filter(s => s.ownerName === form.ownerName), [stockInfo, form.ownerName])
  const selectedProgramStock = useMemo(() => stockInfo.find(s => s.accountId === form.accountId), [stockInfo, form.accountId])
  const programConfig = useMemo(() => programs.find(p => p.id === selectedProgramStock?.programId), [programs, selectedProgramStock])

  // Passenger cycle validation
  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0
    let relevant = sales.filter(s => s.program === form.program)
    if (programConfig.passengerCycleType === "anual") {
      const year = new Date().getFullYear()
      relevant = relevant.filter(s => new Date(s.date).getFullYear() === year)
    } else if (programConfig.passengerCycleType === "dias" && programConfig.passengerCycleDays) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - programConfig.passengerCycleDays)
      cutoff.setHours(0, 0, 0, 0)
      relevant = relevant.filter(s => new Date(s.date) >= cutoff)
    }
    return relevant.reduce((sum, s) => sum + s.passengers.length, 0)
  }, [sales, form.program, programConfig])

  // Profit preview usando calcProfit / calcProfitMargin
  const profitPreview = useMemo(() => {
    if (!form.milesUsed || !form.saleValue || !selectedProgramStock) return null
    const miles = parseFloat(form.milesUsed)
    const val = parseFloat(form.saleValue)
    const addCost = parseFloat(form.additionalCost || "0")
    const costPM = selectedProgramStock.averageCostPerMile
    const profit = calcProfit(val, miles, costPM, addCost)
    return { costTotal: miles * costPM, profit, margin: calcProfitMargin(profit, val) }
  }, [form.milesUsed, form.saleValue, form.additionalCost, selectedProgramStock])

  const update = (partial: Partial<SaleFormData>) => setForm(prev => ({ ...prev, ...partial }))

  const handleSubmit = () => {
    // Preenche costPerMile automaticamente do estoque selecionado
    onSubmit({ ...form, costPerMile: selectedProgramStock?.averageCostPerMile ?? 0 })
    setForm(emptyForm)
  }

  const handleCreateClient = () => {
    if (!newClient.name.trim()) { setClientErrors({ name: "Nome é obrigatório" }); return }
    const id = crypto.randomUUID()
    onCreateClient({ id, ...newClient })
    update({ clientId: id, clientName: newClient.name.trim() })
    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" })
    setClientErrors({})
    setIsClientDialogOpen(false)
  }

  const canSubmit = form.ownerName && form.accountId && form.program && form.clientId && form.milesUsed && form.saleValue &&
    (!selectedProgramStock || parseFloat(form.milesUsed) <= selectedProgramStock.availableMiles)

  const passengerLimitExceeded = programConfig?.maxPassengers &&
    usedPassengersInCycle + form.passengers.filter(p => p.name.trim()).length > programConfig.maxPassengers

  return (
    <>
      <FormDrawer open={open} onOpenChange={open => { if (!open) setForm(emptyForm); onOpenChange(open) }} title="Registrar Nova Venda">
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">

          {/* Owner + Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dono da Conta</Label>
              <Select value={form.ownerName} onValueChange={v => update({ ownerName: v, accountId: "", accountName: "", program: "" })}>
                <SelectTrigger><SelectValue placeholder="Selecione o dono" /></SelectTrigger>
                <SelectContent>{ownersList.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta / Programa</Label>
              <Select value={form.accountId} onValueChange={v => {
                const s = selectedOwnerStock.find(x => x.accountId === v)
                update({ accountId: v, accountName: s?.accountName ?? "", program: s?.program ?? "" })
              }} disabled={!form.ownerName}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {selectedOwnerStock.map(s => (
                    <SelectItem key={s.accountId} value={s.accountId}>
                      {s.program} — {s.accountName} ({s.availableMiles.toLocaleString("pt-BR")} milhas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stock info */}
          {selectedProgramStock && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><span className="text-muted-foreground">Milhas disponíveis:</span><p className="font-semibold">{selectedProgramStock.availableMiles.toLocaleString("pt-BR")}</p></div>
                <div><span className="text-muted-foreground">Custo médio por milha:</span><p className="font-semibold">R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}</p></div>
              </div>
            </div>
          )}

          {/* Client + Locator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={form.clientId} onValueChange={v => { const c = clients.find(x => x.id === v); update({ clientId: v, clientName: c?.name || "" }) }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} title="Novo cliente"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Localizador do Bilhete</Label>
              <Input value={form.ticketLocator} onChange={e => update({ ticketLocator: e.target.value })} placeholder="Ex: ABC123" />
            </div>
          </div>

          {/* Miles + Price + Value (grid 3 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Milhas Utilizadas</Label>
              <Input type="number" value={form.milesUsed} onChange={e => {
                const v = e.target.value
                update(v && form.pricePerMile
                  ? { milesUsed: v, saleValue: (parseFloat(v) * parseFloat(form.pricePerMile)).toFixed(2) }
                  : { milesUsed: v })
              }} placeholder="Ex: 50000" max={selectedProgramStock?.availableMiles} />
              {selectedProgramStock && <p className="text-xs text-muted-foreground">Estoque: {selectedProgramStock.availableMiles.toLocaleString("pt-BR")} milhas</p>}
              {form.milesUsed && selectedProgramStock && parseFloat(form.milesUsed) > selectedProgramStock.availableMiles && (
                <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor por Milha (R$)</Label>
              <Input type="number" step="0.0001" value={form.pricePerMile} onChange={e => {
                const v = e.target.value
                update(v && form.milesUsed
                  ? { pricePerMile: v, saleValue: (parseFloat(v) * parseFloat(form.milesUsed)).toFixed(2) }
                  : { pricePerMile: v })
              }} placeholder="Ex: 0.03" />
            </div>
            <div className="space-y-2">
              <Label>Valor da Venda (R$)</Label>
              <Input type="number" step="0.01" value={form.saleValue} onChange={e => update({ saleValue: e.target.value })} placeholder="Ex: 300.00" />
              {form.pricePerMile && form.milesUsed && (
                <p className="text-xs text-muted-foreground">{parseFloat(form.milesUsed).toLocaleString("pt-BR")} × R$ {parseFloat(form.pricePerMile).toFixed(4)}</p>
              )}
            </div>
          </div>

          {/* Additional Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo Adicional (R$)</Label>
              <Input type="number" step="0.01" value={form.additionalCost} onChange={e => update({ additionalCost: e.target.value })} placeholder="Ex: 50.00" />
            </div>
            <div className="space-y-2">
              <Label>Observação do Custo</Label>
              <Input value={form.additionalCostDesc} onChange={e => update({ additionalCostDesc: e.target.value })} placeholder="Ex: Taxa de embarque" />
            </div>
          </div>

          {/* Profit Preview via calcProfit / calcProfitMargin (DRY) */}
          {profitPreview && (
            <div className="p-3 bg-success-light rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><span className="text-muted-foreground">Custo total:</span><p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p></div>
                {form.additionalCost && parseFloat(form.additionalCost) > 0 && (
                  <div><span className="text-muted-foreground">Custo adicional:</span><p className="font-semibold text-destructive">R$ {parseFloat(form.additionalCost).toFixed(2)}</p></div>
                )}
                <div><span className="text-muted-foreground">Lucro:</span><p className="font-semibold text-success">R$ {profitPreview.profit.toFixed(2)}</p></div>
                <div><span className="text-muted-foreground">Margem:</span><p className="font-semibold">{profitPreview.margin.toFixed(1)}%</p></div>
              </div>
            </div>
          )}

          {/* Passengers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Passageiros no Bilhete</Label>
              <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={() => update({ passengers: [...form.passengers, emptyPassenger()] })}>Adicionar</Button>
            </div>
            {form.passengers.map((p, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                <Select value={p.clientId ?? ""} onValueChange={v => {
                  if (v === "__manual__") {
                    const upd = form.passengers.map((x, j) => j === i ? { ...x, clientId: undefined, name: "", cpf: "" } : x)
                    update({ passengers: upd })
                  } else {
                    const client = clients.find(c => c.id === v)
                    if (client) {
                      const upd = form.passengers.map((x, j) => j === i ? { ...x, clientId: client.id, name: client.name, cpf: client.cpf ?? x.cpf } : x)
                      update({ passengers: upd })
                    }
                  }
                }}>
                  <SelectTrigger className="w-24 text-xs"><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__manual__">— Manual —</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Nome completo" value={p.name} onChange={e => update({ passengers: form.passengers.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} />
                <Input placeholder="ID Passageiro" value={p.passengerId} disabled className="bg-muted/30 text-muted-foreground text-xs" />
                <Input placeholder="CPF" value={p.cpf} onChange={e => update({ passengers: form.passengers.map((x, j) => j === i ? { ...x, cpf: e.target.value } : x) })} />
                {form.passengers.length > 1 && (
                  <Button type="button" size="sm" variant="outline" className="min-h-[44px] min-w-[44px]" onClick={() => update({ passengers: form.passengers.filter((_, j) => j !== i) })}>×</Button>
                )}
              </div>
            ))}
          </div>

          {passengerLimitExceeded && (
            <p className="text-xs text-destructive">
              Limite de {programConfig!.maxPassengers} passageiros excedido para este ciclo.
              Usados: {usedPassengersInCycle} + {form.passengers.filter(p => p.name.trim()).length} novo(s) = {usedPassengersInCycle + form.passengers.filter(p => p.name.trim()).length}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90" disabled={!canSubmit || !!passengerLimitExceeded}>Registrar Venda</Button>
        </div>
      </FormDrawer>

      {/* Client creation dialog */}
      <FormDrawer open={isClientDialogOpen} onOpenChange={open => { setIsClientDialogOpen(open); if (!open) setClientErrors({}) }} title="Novo Cliente">
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <Input value={newClient.name} onChange={e => { setNewClient(p => ({...p, name: e.target.value})); setClientErrors(prev => ({...prev, name: ""})) }} placeholder="Digite o nome completo" />
            {clientErrors.name && <p className="text-xs text-destructive">{clientErrors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>CPF</Label>
            <Input value={newClient.cpf} onChange={e => setNewClient(p => ({...p, cpf: formatCPF(e.target.value.replace(/\D/g, "").slice(0, 11))}))} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({...p, email: e.target.value}))} placeholder="cliente@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={newClient.phone} onChange={e => setNewClient(p => ({...p, phone: e.target.value}))} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Contato Telegram</Label>
            <Input value={newClient.telegram} onChange={e => setNewClient(p => ({...p, telegram: e.target.value}))} placeholder="@usuario" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setIsClientDialogOpen(false); setClientErrors({}) }}>Cancelar</Button>
          <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">Cadastrar</Button>
        </div>
      </FormDrawer>
    </>
  )
}
```

- [ ] **Step 2: Verificar build**

---

### Task 5: Refatorar `Vendas.tsx`

**Files:**
- Modify: `src/pages/Vendas.tsx` — substituir blocos inline pelos 4 componentes

**O que muda:**
1. Adiciona imports: `SaleMetrics`, `SaleForm`, `SaleTable`, `SaleSimulator`, `StockItem`, `SaleFormData`
2. Adiciona imports: `calcProfit`, `calcProfitMargin` de `@/lib/metrics`
3. Adiciona import: `useUpdateSaleMutation` de `@/hooks/useDatabase`
4. Remove todo o estado interno do formulário, simulador, client dialog, AlertDialog
5. Mantém apenas: data fetching, filtros, mutations, renderização dos componentes

- [ ] **Step 1: Reescrever Vendas.tsx**

```tsx
import { useState, useMemo } from "react"
import { Plus, Search, Calculator } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader"
import { useDebounce } from "@/hooks/useDebounce"
import { useHaptic } from "@/hooks/useHaptic"
import { useData } from "@/contexts/DataContext"
import { useAddSaleMutation, useUpdateSaleMutation, useCancelSaleMutation, useAddClientMutation } from "@/hooks/useDatabase"
import { calcProfit, calcProfitMargin } from "@/lib/metrics"
import { SaleMetrics } from "@/components/SaleMetrics"
import { SaleForm, type SaleFormData } from "@/components/SaleForm"
import { SaleTable } from "@/components/SaleTable"
import { SaleSimulator, type StockItem } from "@/components/SaleSimulator"
import confetti from "canvas-confetti"
import type { Sale } from "@/types"

export default function Vendas() {
  const { clients, accounts, owners, programs, sales, isLoading } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const addSaleM = useAddSaleMutation()
  const updateSaleM = useUpdateSaleMutation()
  const cancelSaleM = useCancelSaleMutation()
  const addClientM = useAddClientMutation()
  const haptic = useHaptic()

  // Stock info compartilhado com o Simulador
  const stockInfo: StockItem[] = useMemo(() =>
    accounts.filter(a => a.type === "milhas" && a.status === "ativa").map(a => ({
      accountId: a.id,
      ownerName: owners.find(o => o.id === a.ownerId)?.name ?? "",
      accountName: a.name,
      averageCostPerMile: a.averageCostPerMile ?? 0,
    })), [accounts, owners])

  // Handlers
  const handleCreateSale = (data: SaleFormData) => {
    const milesUsed = parseFloat(data.milesUsed)
    const saleValue = parseFloat(data.saleValue)
    const additionalCost = parseFloat(data.additionalCost || "0")
    // costPerMile vem preenchido pelo SaleForm a partir do estoque selecionado
    const costPerMile = data.costPerMile ?? 0
    const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost)
    const profitMargin = calcProfitMargin(profit, saleValue)

    addSaleM.mutate(
      {
        id: crypto.randomUUID(),
        accountId: data.accountId,
        ownerName: data.ownerName,
        accountName: data.accountName,
        program: data.program,
        clientId: data.clientId,
        clientName: data.clientName,
        milesUsed,
        saleValue,
        pricePerMile: parseFloat(data.pricePerMile) || undefined,
        additionalCost: additionalCost || undefined,
        additionalCostDesc: data.additionalCostDesc.trim() || undefined,
        costPerMile,
        profit,
        profitMargin,
        status: "pendente" as const,
        ticketLocator: data.ticketLocator,
        passengers: data.passengers.filter(p => p.name.trim()),
        date: new Date().toISOString().split("T")[0],
      } as Sale,
      {
        onSuccess: () => {
          haptic.success()
          if (saleValue >= 200) {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#6366f1", "#f59e0b", "#10b981"] })
          }
        },
      },
    )
    setIsCreateDialogOpen(false)
  }

  const handleCancelSale = (saleId: string) => {
    cancelSaleM.mutate(saleId)
  }

  const handleStatusChange = (saleId: string, status: "pendente" | "pago" | "concluido") => {
    updateSaleM.mutate({ id: saleId, status })
  }

  const handleCreateClient = (data: { id: string; name: string; cpf: string; email: string; phone: string; telegram: string }) => {
    addClientM.mutate({
      id: data.id,
      name: data.name.trim(),
      cpf: data.cpf,
      email: data.email.trim(),
      phone: data.phone,
      telegram: data.telegram,
      totalPurchases: 0,
      usageHistory: [],
    })
  }

  // Filtros
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (statusFilter !== "todos" && s.status !== statusFilter) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return s.clientName.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q) || s.ticketLocator.toLowerCase().includes(q)
    })
  }, [sales, statusFilter, debouncedSearch])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-appear">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas de Milhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as vendas de milhas e controle de estoque por dono</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input className="pl-9 w-full sm:w-56" placeholder="Buscar venda..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={() => setSimulatorOpen(true)}>
              <Calculator className="h-4 w-4" />Simular
            </Button>
            <Button className="flex-1 sm:flex-none gap-2 bg-gradient-primary hover:opacity-90" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />Nova Venda
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <SaleMetrics sales={sales} />

      {/* Tabela de vendas */}
      <SaleTable
        sales={filteredSales}
        onCancel={handleCancelSale}
        onStatusChange={handleStatusChange}
      />

      {/* Formulário de criação */}
      <SaleForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        accounts={accounts}
        owners={owners}
        programs={programs}
        clients={clients}
        sales={sales}
        onSubmit={handleCreateSale}
        onCreateClient={handleCreateClient}
      />

      {/* Simulador */}
      <SaleSimulator
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        stockInfo={stockInfo}
      />
    </div>
  )
}
```

- [ ] **Step 2: Build + type-check**

```bash
cd /home/andreluiz0787/repos/mileage-flow-manager && npx tsc --noEmit 2>&1
```

Expected: Sem erros de tipo.

---

### Task 6: Relatório HTML

**Files:**
- Create: `docs/reports/2026-07-08-vendas-extract-components.html`

- [ ] **Step 1: Gerar relatório**

Use o template `/report` para gerar o relatório HTML com:
- Antes/depois: linhas, componentes, duplicação de cálculos
- Benefícios: DRY (metrics.ts), componentização, testabilidade
- Tabela de métricas (SaleMetrics, SaleForm, SaleTable, SaleSimulator)
- Consumo de tokens da sessão

- [ ] **Step 2: Commit + PR**

```bash
git add -A
git commit -m "refactor: extract SaleForm, SaleTable, SaleMetrics, SaleSimulator from Vendas.tsx

- Vendas.tsx: 1117 → ~300 linhas (-73%)
- Componentes: SaleMetrics (cards), SaleForm (create+client dialog),
  SaleTable (desktop+mobile+cancel), SaleSimulator (profit calculator)
- DRY: inline calcProfit/calcProfitMargin → @/lib/metrics
- Segue padrão do #6 (Entradas refactor)"
```

Criar PR para `develop`.
