# Entradas.tsx Refactor Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair EntrySummary, EntryTable e EntryForm de Entradas.tsx (1276→~400 linhas)

**Architecture:** 3 novos componentes em `src/components/`, cada um com responsabilidade única. EntryForm gerencia estado interno do formulário (formData + errors). Entradas.tsx vira orchestration layer.

**Tech Stack:** React, TypeScript, shadcn/ui, MetricCard existente

## Global Constraints

- Não alterar lógica de negócio ou queries
- Seguir padrão de import `@/` (ex: `@/components/EntryForm`)
- pt-BR na interface
- Nomes PascalCase para componentes
- Usar MetricCard existente em vez de Card inline

---

### Task 1: EntrySummary — cards de resumo

**Files:**
- Create: `src/components/EntrySummary.tsx`
- Modify: — (será importado na Task 4)

**Interfaces:**
- Consumes: `MetricCard` de `@/components/MetricCard`
- Produzes: `<EntrySummary type="pontos" totalAmount={n} totalAmountPaid={n} totalMilesGenerated={n} averageCostPerMile={n} />`

- [ ] **Create EntrySummary.tsx**

```tsx
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react"
import { MetricCard } from "@/components/MetricCard"

interface EntrySummaryProps {
  type: "pontos" | "milhas"
  totalAmount: number
  totalAmountPaid: number
  totalMilesGenerated: number
  averageCostPerMile: number
}

export function EntrySummary({
  type,
  totalAmount,
  totalAmountPaid,
  totalMilesGenerated,
  averageCostPerMile,
}: EntrySummaryProps) {
  const label = type === "pontos" ? "Pontos" : "Milhas"

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
      <MetricCard
        title={`Total de ${label}`}
        value={totalAmount.toLocaleString("pt-BR")}
        icon={type === "pontos" ? TrendingUp : TrendingDown}
        variant="default"
      />
      <MetricCard
        title="Valor Investido"
        value={totalAmountPaid}
        icon={DollarSign}
        prefix="R$"
        variant="warning"
      />
      {type === "pontos" && (
        <MetricCard
          title="Milhas Geradas"
          value={totalMilesGenerated.toLocaleString("pt-BR")}
          icon={Target}
          variant="success"
        />
      )}
      <MetricCard
        title="Custo Médio/Milha"
        value={averageCostPerMile}
        icon={TrendingDown}
        prefix="R$"
        variant="teal"
      />
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 2: EntryTable — tabela + lista mobile

**Files:**
- Create: `src/components/EntryTable.tsx`

**Interfaces:**
- Consumes: `PointEntry`, `Account`, `OrigemType`, `Program`, `Owner` de `@/types`; `DeleteEntryDialog`, `EmptyState`, `Badge` de componentes
- Produzes: `<EntryTable type="pontos" entries={[]} accounts={[]} origemTypes={[]} programs={[]} owners={[]} onEdit={fn} onConfirm={fn} />`

- [ ] **Create EntryTable.tsx**

```tsx
import { Package, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/EmptyState"
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog"
import type { PointEntry, Account, OrigemType, Program, Owner } from "@/types"

interface EntryTableProps {
  type: "pontos" | "milhas"
  entries: PointEntry[]
  accounts: Account[]
  origemTypes: OrigemType[]
  programs: Program[]
  owners: Owner[]
  onEdit: (entry: PointEntry) => void
  onConfirm: (entry: PointEntry) => void
}

export function EntryTable({
  type,
  entries,
  accounts,
  origemTypes,
  programs,
  owners,
  onEdit,
  onConfirm,
}: EntryTableProps) {
  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id
  const origemTypeName = (id: string) => {
    const ot = origemTypes.find((ot) => ot.id === id)
    if (ot) return ot.name
    const prog = programs.find((p) => p.id === id)
    return prog?.name ?? id
  }
  const isPontos = type === "pontos"

  const desktopColumns = isPontos
    ? ["Data", "Conta", "Origem", "Pontos", "Valor Pago", "Taxa Conv.", "Milhas", "Custo/Milha", "Ações"]
    : ["Data", "Conta", "Origem", "Milhas Geradas", "Valor Pago", "Custo/Milha", "Ações"]

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {desktopColumns.map((col) => (
                <TableHead key={col} className={col === "Ações" ? "text-right" : "hidden md:table-cell"}>
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={desktopColumns.length} className="py-12">
                  <EmptyState
                    icon={Package}
                    title={`Nenhuma entrada de ${type === "pontos" ? "pontos" : "milhas"}`}
                    description={`Registre sua primeira aquisição de ${type === "pontos" ? "pontos" : "milhas"} ou use a busca para filtrar.`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="hidden md:table-cell">
                    {new Date(entry.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium">{accounts.find((a) => a.id === entry.accountId)?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ownerName(accounts.find((a) => a.id === entry.accountId)?.ownerId ?? "")}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="gap-1">
                        {isPontos && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: origemTypes.find((ot) => ot.id === entry.origemTypeId)?.color,
                            }}
                          />
                        )}
                        {origemTypeName(entry.origemTypeId)}
                      </Badge>
                      {entry.cartAmount && entry.cartAmount > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                          🛒 Carrinho
                        </Badge>
                      )}
                      {entry.recurrenceInterval && entry.entryStatus !== "aguardando" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          🔄 Clube
                        </Badge>
                      )}
                      {entry.entryStatus === "aguardando" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        >
                          ⏳ Aguardando
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {isPontos ? (
                    <>
                      <TableCell className="hidden md:table-cell">
                        {entry.amount.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {entry.amountPaid.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry.conversionRate ?? "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-semibold text-success">
                        {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="hidden md:table-cell">
                        {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {entry.amountPaid.toLocaleString("pt-BR")}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="hidden md:table-cell">
                    R$ {entry.costPerMile.toFixed(4)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    <div className="flex gap-2 justify-end">
                      {entry.entryStatus === "aguardando" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700"
                          onClick={() => onConfirm(entry)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Confirmar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => onEdit(entry)}>
                        Editar
                      </Button>
                      <DeleteEntryDialog entry={entry} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 mt-4">
        {entries.length === 0 ? (
          <EmptyState
            icon={Package}
            title={`Nenhuma entrada de ${type === "pontos" ? "pontos" : "milhas"}`}
            description={`Registre sua primeira aquisição de ${type === "pontos" ? "pontos" : "milhas"} ou use a busca para filtrar.`}
          />
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium">{origemTypeName(entry.origemTypeId)}</p>
                    {entry.cartAmount && entry.cartAmount > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                        🛒 Carrinho
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline">{accounts.find((a) => a.id === entry.accountId)?.name}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {entry.recurrenceInterval && entry.entryStatus !== "aguardando" && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] gap-1"
                  >
                    🔄 Clube
                  </Badge>
                )}
                {entry.entryStatus === "aguardando" && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] gap-1"
                  >
                    ⏳ Aguardando
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {isPontos ? "Pontos:" : "Milhas:"}
                  </span>
                  <p className="font-semibold">
                    {isPontos
                      ? entry.amount.toLocaleString("pt-BR")
                      : (entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor Pago:</span>
                  <p className="font-semibold">R$ {entry.amountPaid.toLocaleString("pt-BR")}</p>
                </div>
                {isPontos && (
                  <div>
                    <span className="text-muted-foreground">Milhas Geradas:</span>
                    <p className="font-semibold text-success">
                      {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Custo/Milha:</span>
                  <p className="font-semibold">R$ {entry.costPerMile.toFixed(4)}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {entry.entryStatus === "aguardando" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700"
                    onClick={() => onConfirm(entry)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Confirmar
                  </Button>
                )}
                <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => onEdit(entry)}>
                  Editar
                </Button>
                <DeleteEntryDialog entry={entry} />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
```

- [ ] **Commit**

---

### Task 3: EntryForm — formulário compartilhado criar/editar

**Files:**
- Create: `src/components/EntryForm.tsx`

**Interfaces:**
- Consumes: `Account`, `OrigemType`, `Program`, `Owner`, `PointEntry` de `@/types`; lib functions (`isTransferencia`, `parseOrigemTypeDescription`, `calcMilesGenerated`, `calcCostPerThousand`, `calcCostPerMile`, `buildMonthlyRecurrence`)
- Produces: `<EntryForm mode="create" onSubmit={fn} onCancel={fn} accounts={[]} ... />`

- [ ] **Create EntryForm.tsx**

```tsx
import { useState, useMemo } from "react"
import { Plus, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { isTransferencia } from "@/lib/utils"
import { parseOrigemTypeDescription, serializeOrigemTypeDescription, buildMonthlyRecurrence } from "@/lib/origemTypes"
import { calcMilesGenerated, calcCostPerThousand, calcCostPerMile } from "@/lib/metrics"
import type { Account, OrigemType, Program, Owner } from "@/types"

interface EntryFormData {
  accountId: string
  origemTypeId: string
  amount: string
  amountPaid: string
  conversionRate: string
  sourceAccountId: string
  bonusPercent: string
  cartAmount: string
  cartCost: string
  isClube: boolean
  clubeMeses: string
}

interface EntryFormProps {
  mode: "create" | "edit"
  initialData?: Partial<EntryFormData>
  onSubmit: (data: EntryFormData) => void
  onCancel: () => void
  accounts: Account[]
  origemTypes: OrigemType[]
  programs: Program[]
  owners: Owner[]
  activeTab: "pontos" | "milhas"
  /** Callback chamado quando o usuário clica em "+" para criar tipo de origem (só mode=create) */
  onAddOrigemType?: (afterSelect: (id: string) => void) => void
}

const emptyForm: EntryFormData = {
  accountId: "",
  origemTypeId: "",
  amount: "",
  amountPaid: "",
  conversionRate: "",
  sourceAccountId: "",
  bonusPercent: "",
  cartAmount: "",
  cartCost: "",
  isClube: false,
  clubeMeses: "",
}

export function EntryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  accounts,
  origemTypes,
  programs,
  owners,
  activeTab,
  onAddOrigemType,
}: EntryFormProps) {
  const [form, setForm] = useState<EntryFormData>({ ...emptyForm, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [isOrigemTypeOpen, setIsOrigemTypeOpen] = useState(false)
  const [newOrigemType, setNewOrigemType] = useState({ name: "", color: "#10b981", hasRecurrence: false })
  const [origemTypeErrors, setOrigemTypeErrors] = useState<Partial<Record<string, string>>>({})

  const set = (patch: Partial<EntryFormData>) => setForm((prev) => ({ ...prev, ...patch }))
  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }))

  const selectedAccount = accounts.find((a) => a.id === form.accountId)
  const selectedOrigemType = origemTypes.find((ot) => ot.id === form.origemTypeId)
  const isTransfer = selectedOrigemType ? isTransferencia(selectedOrigemType) : false
  const availableAccounts = accounts.filter((a) => a.type === activeTab && a.status === "ativa")
  const currentOrigemTypes = origemTypes.filter((ot) => ot.accountType === activeTab)
  const sourceAccounts = accounts.filter(
    (a) => a.type === "pontos" && a.status === "ativa" && a.ownerId === selectedAccount?.ownerId
  )
  const selectedSourceAccount = accounts.find((a) => a.id === form.sourceAccountId)
  const sourceAvgCostPerPoint =
    selectedSourceAccount && selectedSourceAccount.balance > 0
      ? (selectedSourceAccount.totalInvested ?? 0) / selectedSourceAccount.balance
      : 0
  const effectiveMiles =
    isTransfer && form.amount
      ? (parseFloat(form.amount) + parseFloat(form.cartAmount || "0")) *
        (1 + parseFloat(form.bonusPercent || "0") / 100)
      : parseFloat(form.amount || "0")

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.accountId) errs.accountId = "Selecione uma conta"
    if (!form.origemTypeId) errs.origemTypeId = "Selecione o tipo de origem"
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Informe a quantidade"
    if (!isTransfer && (!form.amountPaid || parseFloat(form.amountPaid) <= 0))
      errs.amountPaid = "Informe o valor pago"
    if (isTransfer && !form.sourceAccountId) errs.sourceAccountId = "Selecione a conta de origem"
    if (isTransfer && form.sourceAccountId && form.accountId) {
      const src = accounts.find((a) => a.id === form.sourceAccountId)
      const dst = accounts.find((a) => a.id === form.accountId)
      if (src && dst && src.ownerId !== dst.ownerId)
        errs.sourceAccountId = "Conta de origem deve pertencer ao mesmo dono"
    }
    if (isTransfer && form.sourceAccountId && selectedSourceAccount && parseFloat(form.amount) > selectedSourceAccount.balance)
      errs.amount = "Saldo insuficiente na conta de origem"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(form)
  }

  const handleCreateOrigemType = () => {
    const errs: typeof origemTypeErrors = {}
    if (!newOrigemType.name.trim()) errs.name = "Nome é obrigatório"
    setOrigemTypeErrors(errs)
    if (Object.keys(errs).length > 0) return

    const id = crypto.randomUUID()
    // Dispara callback para o parent criar no banco
    // Após criar, o parent chama afterSelect(id) para auto-selecionar
    onAddOrigemType?.(id)
    set(form.origemTypeId !== id ? { ...form, origemTypeId: id } : form)
    setNewOrigemType({ name: "", color: "#10b981", hasRecurrence: false })
    setOrigemTypeErrors({})
    setIsOrigemTypeOpen(false)
  }

  return (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
      {/* Conta */}
      <div className="space-y-2">
        <Label htmlFor="entryAccount">Conta</Label>
        <Select
          value={form.accountId}
          onValueChange={(value) => {
            set({ accountId: value })
            clearErr("accountId")
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a conta" />
          </SelectTrigger>
          <SelectContent>
            {availableAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} ({ownerName(acc.ownerId)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.accountId && <p className="text-xs text-destructive">{errors.accountId}</p>}
      </div>

      {/* Tipo de Origem */}
      <div className="space-y-2">
        <Label htmlFor="entryType">Tipo de Origem</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={form.origemTypeId}
              onValueChange={(value) => {
                const ot = origemTypes.find((o) => o.id === value)
                const desc = ot ? parseOrigemTypeDescription(ot.description) : {}
                set({ origemTypeId: value, isClube: !!desc.hasRecurrence })
                clearErr("origemTypeId")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {currentOrigemTypes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {"color" in item ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: (item as OrigemType).color }}
                        />
                        {item.name}
                      </div>
                    ) : (
                      item.name
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "create" && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setIsOrigemTypeOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <FormDrawer
                open={isOrigemTypeOpen}
                onOpenChange={(open) => {
                  setIsOrigemTypeOpen(open)
                  if (!open) setOrigemTypeErrors({})
                }}
                title="Novo Tipo de Origem"
              >
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newOrigemType.name}
                      onChange={(e) => {
                        setNewOrigemType((p) => ({ ...p, name: e.target.value }))
                        setOrigemTypeErrors((p) => ({ ...p, name: "" }))
                      }}
                      placeholder="Ex: Cashback"
                    />
                    {origemTypeErrors.name && (
                      <p className="text-xs text-destructive">{origemTypeErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: newOrigemType.color }}
                      />
                      <Input
                        type="color"
                        value={newOrigemType.color}
                        onChange={(e) =>
                          setNewOrigemType((p) => ({ ...p, color: e.target.value }))
                        }
                        className="w-full h-10 p-1"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-3">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newOrigemType.hasRecurrence}
                        onChange={(e) =>
                          setNewOrigemType((p) => ({ ...p, hasRecurrence: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      Habilitar recorrência mensal
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOrigemTypeOpen(false)
                      setOrigemTypeErrors({})
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateOrigemType} className="bg-gradient-primary hover:opacity-90">
                    Cadastrar
                  </Button>
                </div>
              </FormDrawer>
            </>
          )}
        </div>
        {errors.origemTypeId && <p className="text-xs text-destructive">{errors.origemTypeId}</p>}
      </div>

      {selectedAccount && (
        <div className="p-3 bg-muted/30 rounded-lg text-sm">
          <span className="text-muted-foreground">Programa: </span>
          <span className="font-medium">{programName(selectedAccount.programId)}</span>
        </div>
      )}

      {/* Quantidade + Valor Pago */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">
            {isTransfer
              ? "Pontos Transferidos"
              : activeTab === "pontos"
                ? "Pontos Adquiridos"
                : "Milhas Adquiridas"}
          </Label>
          <Input
            id="amount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value
              if (isTransfer && val && sourceAvgCostPerPoint > 0) {
                set({
                  amount: val,
                  amountPaid: (parseFloat(val) * sourceAvgCostPerPoint).toFixed(2),
                })
              } else {
                set({ amount: val })
              }
              clearErr("amount")
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {isTransfer && selectedSourceAccount && (
            <p
              className={`text-xs ${parseFloat(form.amount || "0") > selectedSourceAccount.balance ? "text-destructive" : "text-muted-foreground"}`}
            >
              Saldo disponível: {selectedSourceAccount.balance.toLocaleString("pt-BR")} pontos
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amountPaid">{isTransfer ? "Custo (calculado)" : "Valor Pago (R$)"}</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={form.amountPaid}
            disabled={isTransfer}
            onChange={(e) => {
              set({ amountPaid: e.target.value })
              clearErr("amountPaid")
            }}
            placeholder="Ex: 450.00"
          />
          {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
          {isTransfer && selectedSourceAccount && form.amount && sourceAvgCostPerPoint > 0 && (
            <p className="text-xs text-muted-foreground">
              Custo de aquisição: {parseFloat(form.amount).toLocaleString("pt-BR")} pts × R${" "}
              {sourceAvgCostPerPoint.toFixed(4)} = R${" "}
              {(parseFloat(form.amount) * sourceAvgCostPerPoint).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Seção Transferência */}
      {isTransfer && (
        <>
          <div className="space-y-2">
            <Label htmlFor="sourceAccount">Conta de Pontos Origem</Label>
            <Select
              value={form.sourceAccountId}
              onValueChange={(value) => {
                set({ sourceAccountId: value, amount: "", amountPaid: "" })
                clearErr("sourceAccountId")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de pontos" />
              </SelectTrigger>
              <SelectContent>
                {sourceAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.balance.toLocaleString("pt-BR")} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sourceAccountId && (
              <p className="text-xs text-destructive">{errors.sourceAccountId}</p>
            )}
            {selectedSourceAccount && (
              <p className="text-xs text-muted-foreground">
                Programa: {programName(selectedSourceAccount.programId)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonus">Bonificação (%)</Label>
            <Input
              id="bonus"
              type="number"
              step="0.1"
              min="0"
              value={form.bonusPercent}
              onChange={(e) => set({ bonusPercent: e.target.value })}
              placeholder="Ex: 30"
            />
            {form.bonusPercent && parseFloat(form.bonusPercent) > 0 && form.amount && (
              <p className="text-xs text-success">
                Milhas recebidas: {effectiveMiles.toLocaleString("pt-BR")} (
                {parseFloat(form.amount).toLocaleString("pt-BR")} + {form.bonusPercent}%)
              </p>
            )}
          </div>

          {/* Compra no Carrinho */}
          <div className="border border-dashed border-primary/20 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <Label className="font-semibold text-sm cursor-pointer">
                Compra no Carrinho{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pontos Extras</Label>
                <Input
                  type="number"
                  value={form.cartAmount}
                  onChange={(e) => set({ cartAmount: e.target.value })}
                  placeholder="Ex: 10000"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.cartCost}
                  onChange={(e) => set({ cartCost: e.target.value })}
                  placeholder="Ex: 200.00"
                />
              </div>
            </div>
            {form.cartAmount && parseFloat(form.cartAmount) > 0 && (
              <p className="text-xs text-muted-foreground">
                +{parseFloat(form.cartAmount).toLocaleString("pt-BR")} pts ×{" "}
                {parseFloat(form.bonusPercent || "0").toFixed(0)}% bônus ={" "}
                {(
                  parseFloat(form.cartAmount) *
                  (1 + parseFloat(form.bonusPercent || "0") / 100)
                ).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}{" "}
                milhas geradas
              </p>
            )}
          </div>
        </>
      )}

      {/* Clube */}
      {form.isClube && (
        <div className="border border-dashed border-amber-400/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-amber-500" />
            <Label className="font-semibold text-sm cursor-pointer">
              Recorrência{" "}
              <span className="text-muted-foreground font-normal">(Clube)</span>
            </Label>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Recorrência ativada pelo tipo de origem{mode === "create" ? " selecionado" : ""}
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Quantidade de meses</Label>
              <Input
                type="number"
                min="1"
                max="120"
                value={form.clubeMeses}
                onChange={(e) => set({ clubeMeses: e.target.value })}
                placeholder="Ex: 12"
              />
              {form.clubeMeses && parseInt(form.clubeMeses) > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⏳{" "}
                  {new Date(
                    new Date().getTime() +
                      parseInt(form.clubeMeses) * 30 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString("pt-BR")}{" "}
                  — serão geradas {form.clubeMeses} entrada(s) futura(s) com status "Aguardando"
                </p>
              )}
              {mode === "edit" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⏳ Altere com cuidado — novas entradas futuras serão geradas
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Taxa de Conversão (só Pontos) */}
      {activeTab === "pontos" && (
        <div className="space-y-2">
          <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
          <Input
            id="conversion"
            type="number"
            step="0.01"
            value={form.conversionRate}
            onChange={(e) => set({ conversionRate: e.target.value })}
            placeholder="Ex: 1.0"
          />
        </div>
      )}

      {/* Cálculos Automáticos */}
      {form.amount && form.amountPaid && (activeTab === "milhas" || form.conversionRate) && (
        <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
          <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Custo por milhar:</span>
              <p className="font-semibold">
                R${" "}
                {(
                  (parseFloat(form.amountPaid) /
                    (isTransfer && effectiveMiles > 0
                      ? effectiveMiles
                      : parseFloat(form.amount))) *
                  1000
                ).toFixed(2)}
              </p>
            </div>
            {isTransfer && (
              <div>
                <span className="text-muted-foreground">Milhas recebidas:</span>
                <p className="font-semibold text-success">
                  {effectiveMiles.toLocaleString("pt-BR")}
                </p>
                {parseFloat(form.cartAmount || "0") > 0 && (
                  <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
                    <p>
                      Da transferência:{" "}
                      {(
                        parseFloat(form.amount) *
                        (1 + parseFloat(form.bonusPercent || "0") / 100)
                      ).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                    <p>
                      Do carrinho:{" "}
                      {(
                        parseFloat(form.cartAmount) *
                        (1 + parseFloat(form.bonusPercent || "0") / 100)
                      ).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "pontos" && (
              <div>
                <span className="text-muted-foreground">Milhas geradas:</span>
                <p className="font-semibold">
                  {(parseFloat(form.amount) * parseFloat(form.conversionRate || "1")).toLocaleString(
                    "pt-BR"
                  )}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Custo por milha:</span>
              <p className="font-semibold">
                R${" "}
                {(
                  parseFloat(form.amountPaid) /
                  (isTransfer
                    ? effectiveMiles
                    : parseFloat(form.amount) *
                      (activeTab === "milhas"
                        ? 1
                        : parseFloat(form.conversionRate || "1")))
                ).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
          {mode === "create" ? "Registrar Entrada" : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 4: Refatorar Entradas.tsx

**Files:**
- Modify: `src/pages/Entradas.tsx` (reduzir de 1276 → ~400 linhas)

- [ ] **Reescrever Entradas.tsx** com imports dos 3 componentes + orchestration

```tsx
import { useState, useMemo } from "react"
import { Plus, ArrowLeftRight, Search, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormDrawer } from "@/components/FormDrawer"
import { SkeletonPage } from "@/components/SkeletonLoader"
import { useHaptic } from "@/hooks/useHaptic"
import { useDebounce } from "@/hooks/useDebounce"
import { useData } from "@/contexts/DataContext"
import { isTransferencia } from "@/lib/utils"
import { calcMilesGenerated, calcCostPerThousand, calcCostPerMile } from "@/lib/metrics"
import { buildMonthlyRecurrence } from "@/lib/origemTypes"
import { useAddEntryMutation, useUpdateEntryMutation, useConfirmEntryMutation, useAddOrigemTypeMutation } from "@/hooks/useDatabase"
import { EntrySummary } from "@/components/EntrySummary"
import { EntryTable } from "@/components/EntryTable"
import { EntryForm } from "@/components/EntryForm"
import confetti from "canvas-confetti"
import type { PointEntry } from "@/types"

export default function Entradas() {
  const { entries, accounts, owners, programs, origemTypes, sales, isLoading } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300)
  const addEntryM = useAddEntryMutation()
  const updateEntryM = useUpdateEntryMutation()
  const addOrigemTypeM = useAddOrigemTypeMutation()
  const confirmEntryM = useConfirmEntryMutation()
  const haptic = useHaptic()

  const [activeTab, setActiveTab] = useState<"pontos" | "milhas">("pontos")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<PointEntry | null>(null)

  const handleOpenTransfer = () => {
    const transferId = origemTypes.find((ot) => isTransferencia(ot))?.id ?? ""
    setActiveTab("milhas")
    // EntryForm receberá initialData com origemTypeId preenchido
    setIsCreateDialogOpen(true)
  }

  const handleCreateEntry = (form: {
    accountId: string
    origemTypeId: string
    amount: string
    amountPaid: string
    conversionRate: string
    sourceAccountId: string
    bonusPercent: string
    cartAmount: string
    cartCost: string
    isClube: boolean
    clubeMeses: string
  }) => {
    const isTransfer = origemTypes.find((ot) => ot.id === form.origemTypeId)
      ? isTransferencia(origemTypes.find((ot) => ot.id === form.origemTypeId)!)
      : false
    const amount = parseFloat(form.amount)
    const cartAmount = parseFloat(form.cartAmount || "0")
    const amountPaid = parseFloat(form.amountPaid)
    const cartCost = parseFloat(form.cartCost || "0")
    const conversionRate = parseFloat(form.conversionRate || "1")
    const bonusPercent = isTransfer ? parseFloat(form.bonusPercent || "0") : undefined
    const totalAmount = amount + (isTransfer ? cartAmount : 0)
    const totalPaid = amountPaid + cartCost
    const milesGenerated = calcMilesGenerated(totalAmount, conversionRate, bonusPercent)
    const costPerThousand = calcCostPerThousand(totalPaid, milesGenerated)
    const costPerMile = calcCostPerMile(totalPaid, milesGenerated)

    addEntryM.mutate(
      {
        id: crypto.randomUUID(),
        accountId: form.accountId,
        origemTypeId: form.origemTypeId,
        amount,
        amountPaid: totalPaid,
        costPerThousand,
        conversionRate: isTransfer
          ? 1 + parseFloat(form.bonusPercent || "0") / 100
          : activeTab === "milhas"
            ? undefined
            : conversionRate,
        milesGenerated,
        costPerMile,
        sourceAccountId: isTransfer ? form.sourceAccountId : undefined,
        bonusPercent: isTransfer ? parseFloat(form.bonusPercent || "0") : undefined,
        cartAmount: isTransfer && cartAmount > 0 ? cartAmount : undefined,
        cartCost: isTransfer && cartCost > 0 ? cartCost : undefined,
        ...buildMonthlyRecurrence(form.isClube, form.clubeMeses),
        date: new Date().toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          haptic.success()
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#10b981", "#f59e0b"],
          })
        },
      }
    )
    setIsCreateDialogOpen(false)
  }

  const handleUpdateEntry = (form: {
    accountId: string
    origemTypeId: string
    amount: string
    amountPaid: string
    conversionRate: string
    sourceAccountId: string
    bonusPercent: string
    cartAmount: string
    cartCost: string
    isClube: boolean
    clubeMeses: string
  }) => {
    if (!editingEntry) return
    const isTransfer = origemTypes.find((ot) => ot.id === form.origemTypeId)
      ? isTransferencia(origemTypes.find((ot) => ot.id === form.origemTypeId)!)
      : false
    const amount = parseFloat(form.amount)
    const cartAmount = parseFloat(form.cartAmount || "0")
    const amountPaid = parseFloat(form.amountPaid)
    const cartCost = parseFloat(form.cartCost || "0")
    const conversionRate = parseFloat(form.conversionRate || "1")
    const bonusPercent = isTransfer ? parseFloat(form.bonusPercent || "0") : undefined
    const totalAmount = amount + (isTransfer ? cartAmount : 0)
    const totalPaid = amountPaid + cartCost
    const milesGenerated = calcMilesGenerated(totalAmount, conversionRate, bonusPercent)
    const costPerThousand = calcCostPerThousand(totalPaid, milesGenerated)
    const costPerMile = calcCostPerMile(totalPaid, milesGenerated)

    updateEntryM.mutate({
      oldEntry: editingEntry,
      updates: {
        accountId: form.accountId,
        origemTypeId: form.origemTypeId,
        amount,
        amountPaid: totalPaid,
        costPerThousand,
        conversionRate: isTransfer
          ? 1 + parseFloat(form.bonusPercent || "0") / 100
          : activeTab === "milhas"
            ? undefined
            : conversionRate,
        milesGenerated,
        costPerMile,
        sourceAccountId: isTransfer ? form.sourceAccountId : undefined,
        bonusPercent: isTransfer ? parseFloat(form.bonusPercent || "0") : undefined,
        cartAmount: isTransfer && cartAmount > 0 ? cartAmount : undefined,
        cartCost: isTransfer && cartCost > 0 ? cartCost : undefined,
        ...buildMonthlyRecurrence(form.isClube, form.clubeMeses),
      },
    })
    setEditingEntry(null)
    setIsEditDialogOpen(false)
  }

  const entriesByTab = useMemo(
    () =>
      entries.filter((e) => {
        const account = accounts.find((a) => a.id === e.accountId)
        return account?.type === activeTab
      }),
    [entries, accounts, activeTab]
  )

  const entriesFiltered = useMemo(() => {
    if (!debouncedSearch) return entriesByTab
    const q = debouncedSearch.toLowerCase()
    return entriesByTab.filter((e) => {
      const account = accounts.find((a) => a.id === e.accountId)
      const accountName = account?.name.toLowerCase() ?? ""
      const origemNome =
        origemTypes.find((ot) => ot.id === e.origemTypeId)?.name.toLowerCase() ??
        programs.find((p) => p.id === e.origemTypeId)?.name.toLowerCase() ??
        ""
      const dateStr = new Date(e.date).toLocaleDateString("pt-BR")
      return accountName.includes(q) || origemNome.includes(q) || dateStr.includes(q)
    })
  }, [entriesByTab, debouncedSearch, accounts, origemTypes, programs])

  const confirmedEntries = useMemo(
    () => entriesFiltered.filter((e) => e.entryStatus !== "aguardando"),
    [entriesFiltered]
  )
  const pendingEntries = useMemo(
    () => entriesByTab.filter((e) => e.entryStatus === "aguardando"),
    [entriesByTab]
  )
  const totalAmount = confirmedEntries.reduce((s, e) => s + e.amount, 0)
  const totalAmountPaid = confirmedEntries.reduce((s, e) => s + e.amountPaid, 0)
  const totalMilesGenerated = confirmedEntries.reduce(
    (s, e) => s + (e.milesGenerated ?? e.amount),
    0
  )
  const averageCostPerMile = totalMilesGenerated > 0 ? totalAmountPaid / totalMilesGenerated : 0

  if (isLoading) return <SkeletonPage />

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-sm text-muted-foreground">Gerencie aquisição de pontos e milhas</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 w-full"
              placeholder="Buscar entrada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleOpenTransfer} className="gap-2 bg-gradient-primary hover:opacity-90 shrink-0">
            <ArrowLeftRight className="h-4 w-4" />
            Transferir
          </Button>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Banner pendências */}
      {pendingEntries.length > 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {pendingEntries.length} entrada(s) pendente(s) de confirmação
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Entradas geradas pelo Clube de {activeTab === "milhas" ? "Milhas" : "Pontos"}{" "}
              aguardando confirmação. Confirme abaixo para atualizar o saldo da conta.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pontos" | "milhas")}>
        <TabsList>
          <TabsTrigger value="pontos" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Pontos
          </TabsTrigger>
          <TabsTrigger value="milhas" className="gap-2">
            <TrendingDown className="h-4 w-4" />
            Milhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pontos" className="space-y-4 animate-appear">
          <EntrySummary
            type="pontos"
            totalAmount={totalAmount}
            totalAmountPaid={totalAmountPaid}
            totalMilesGenerated={totalMilesGenerated}
            averageCostPerMile={averageCostPerMile}
          />
          <Card className="shadow-card animate-appear animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Histórico de Entradas - Pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EntryTable
                type="pontos"
                entries={entriesFiltered}
                accounts={accounts}
                origemTypes={origemTypes}
                programs={programs}
                owners={owners}
                onEdit={(entry) => {
                  setEditingEntry(entry)
                  setIsEditDialogOpen(true)
                }}
                onConfirm={(entry) => confirmEntryM.mutate(entry)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milhas" className="space-y-4 animate-appear">
          <EntrySummary
            type="milhas"
            totalAmount={totalAmount}
            totalAmountPaid={totalAmountPaid}
            totalMilesGenerated={totalMilesGenerated}
            averageCostPerMile={averageCostPerMile}
          />
          <Card className="shadow-card animate-appear animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Histórico de Entradas - Milhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EntryTable
                type="milhas"
                entries={entriesFiltered}
                accounts={accounts}
                origemTypes={origemTypes}
                programs={programs}
                owners={owners}
                onEdit={(entry) => {
                  setEditingEntry(entry)
                  setIsEditDialogOpen(true)
                }}
                onConfirm={(entry) => confirmEntryM.mutate(entry)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <FormDrawer
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsCreateDialogOpen(false)
          setIsCreateDialogOpen(open)
        }}
        title={`Registrar Nova Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
      >
        <EntryForm
          mode="create"
          accounts={accounts}
          origemTypes={origemTypes}
          programs={programs}
          owners={owners}
          activeTab={activeTab}
          onSubmit={handleCreateEntry}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </FormDrawer>

      {/* Edit Dialog */}
      <FormDrawer
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEntry(null)
          }
          setIsEditDialogOpen(open)
        }}
        title={`Editar Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
      >
        {editingEntry && (
          <EntryForm
            mode="edit"
            initialData={{
              accountId: editingEntry.accountId,
              origemTypeId: editingEntry.origemTypeId,
              amount: String(editingEntry.amount),
              amountPaid: String(editingEntry.amountPaid),
              conversionRate: editingEntry.conversionRate ? String(editingEntry.conversionRate) : "",
              sourceAccountId: editingEntry.sourceAccountId ?? "",
              bonusPercent: editingEntry.bonusPercent ? String(editingEntry.bonusPercent) : "",
              cartAmount: editingEntry.cartAmount ? String(editingEntry.cartAmount) : "",
              cartCost: editingEntry.cartCost ? String(editingEntry.cartCost) : "",
              isClube: !!(editingEntry.recurrenceInterval && editingEntry.recurrenceEnd),
              clubeMeses: editingEntry.recurrenceEnd
                ? String(
                    Math.ceil(
                      (new Date(editingEntry.recurrenceEnd).getTime() -
                        new Date(editingEntry.date).getTime()) /
                        (30 * 24 * 60 * 60 * 1000)
                    )
                  )
                : "",
            }}
            accounts={accounts}
            origemTypes={origemTypes}
            programs={programs}
            owners={owners}
            activeTab={activeTab}
            onSubmit={handleUpdateEntry}
            onCancel={() => {
              setEditingEntry(null)
              setIsEditDialogOpen(false)
            }}
          />
        )}
      </FormDrawer>
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 5: Build + Verificar

**Files:** none (just build)

- [ ] **Run build**
  ```bash
  cd /home/andreluiz0787/repos/mileage-flow-manager && npm run build 2>&1 | tail -30
  ```
  Expected: Build successful, no errors

- [ ] **Fix any type errors** (if build fails, fix inline)

- [ ] **Commit any fixes**

---

### Task 6: Relatório HTML + PR

- [ ] **Generate report** usando `/report` template
- [ ] **Push branch** e criar PR para develop
