import { useState } from "react"
import { Plus, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { isTransferencia } from "@/lib/utils"
import { parseOrigemTypeDescription } from "@/lib/origemTypes"
import type { Account, OrigemType, Program, Owner } from "@/types"
import { parseDescription } from "@/types/index"

export interface EntryFormData {
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
  // New fields for recurrence feature
  date: string // YYYY-MM-DD
  isRecurrent: boolean
  recurrenceType: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  recurrenceCount: number // >=1
  startDate: string // YYYY-MM-DD
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
  date: "",
  isRecurrent: false,
  recurrenceType: "monthly",
  recurrenceCount: 1,
  startDate: "",
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
  /** Cria um tipo de origem no banco e retorna o ID (só mode=create) */
  onCreateOrigemType?: (data: { name: string; color: string; hasRecurrence: boolean }) => Promise<string | undefined>
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
  onCreateOrigemType,
}: EntryFormProps) {
  const [form, setForm] = useState<EntryFormData>({ ...emptyForm, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [isOrigemTypeOpen, setIsOrigemTypeOpen] = useState(false)
  const [newOT, setNewOT] = useState({ name: "", color: "#10b981", hasRecurrence: false })
  const [isCreatingOrigemType, setIsCreatingOrigemType] = useState(false)
  const [otErrors, setOtErrors] = useState<Partial<Record<string, string>>>({})

  const set = (patch: Partial<EntryFormData>) => setForm((prev) => ({ ...prev, ...patch }))
  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }))

  const selectedAccount = accounts.find((a) => a.id === form.accountId)
  const selectedOrigemType = origemTypes.find((ot) => ot.id === form.origemTypeId)
  const isTransfer = selectedOrigemType ? isTransferencia(selectedOrigemType) : false
  const availableAccounts = accounts.filter((a) => a.type === activeTab && a.status === "ativa")
  const currentOrigemTypes = origemTypes.filter((ot) => ot.accountType === activeTab && !isTransferencia(ot))
  const sourceAccounts = accounts.filter(
    (a) => a.type === "pontos" && a.status === "ativa" && (!selectedAccount || a.ownerId === selectedAccount.ownerId)
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
    if (!form.date) errs.date = "Selecione a data"
    if (form.isRecurrent) {
      if (form.recurrenceCount < 1) errs.recurrenceCount = "Quantidade de parcelas deve ser >= 1"
      if (!form.startDate) errs.startDate = "Selecione a data de início"
    }
    if (isTransfer && !form.sourceAccountId) errs.sourceAccountId = "Selecione a conta de origem"
    if (isTransfer && form.sourceAccountId && form.accountId) {
      const src = accounts.find((a) => a.id === form.sourceAccountId)
      const dst = accounts.find((a) => a.id === form.accountId)
      if (src && dst && src.ownerId !== dst.ownerId)
        errs.sourceAccountId = "Conta de origem deve pertencer ao mesmo dono"
    }
    if (
      isTransfer &&
      form.sourceAccountId &&
      selectedSourceAccount &&
      parseFloat(form.amount) > selectedSourceAccount.balance
    )
      errs.amount = "Saldo insuficiente na conta de origem"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit(form)
  }

  const handleCreateOrigemType = async () => {
    const errs: typeof otErrors = {}
    if (!newOT.name.trim()) errs.name = "Nome é obrigatório"
    setOtErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsCreatingOrigemType(true)
    try {
      const id = await onCreateOrigemType?.({
        name: newOT.name.trim(),
        color: newOT.color,
        hasRecurrence: newOT.hasRecurrence,
      })
      if (id) set({ origemTypeId: id, isClube: newOT.hasRecurrence })
      setNewOT({ name: "", color: "#10b981", hasRecurrence: false })
      setOtErrors({})
      setIsOrigemTypeOpen(false)
    } finally {
      setIsCreatingOrigemType(false)
    }
  }

  // Helper to format date to YYYY-MM-DD
  const formatDate = (date: Date): string =>
    date.toISOString().split("T")[0]

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
                const desc = ot ? parseOrigemTypeDescription(ot.description) : { hasRecurrence: false }
                set({ origemTypeId: value, isClube: desc.hasRecurrence })
                clearErr("origemTypeId")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {currentOrigemTypes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mode === "create" && onCreateOrigemType && (
            <>
              <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsOrigemTypeOpen(true)}>
                <Plus className="h-4 w-4" />
              </Button>
              <FormDrawer
                open={isOrigemTypeOpen}
                onOpenChange={(open) => {
                  setIsOrigemTypeOpen(open)
                  if (!open) setOtErrors({})
                }}
                title="Novo Tipo de Origem"
              >
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newOT.name}
                      onChange={(e) => {
                        setNewOT((p) => ({ ...p, name: e.target.value }))
                        setOtErrors((p) => ({ ...p, name: "" }))
                      }}
                      placeholder="Ex: Cashback"
                    />
                    {otErrors.name && <p className="text-xs text-destructive">{otErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newOT.color }} />
                      <Input
                        type="color"
                        value={newOT.color}
                        onChange={(e) => setNewOT((p) => ({ ...p, color: e.target.value }))}
                        className="w-full h-10 p-1"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-3 space-y-3">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newOT.hasRecurrence}
                        onChange={(e) => setNewOT((p) => ({ ...p, hasRecurrence: e.target.checked }))}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      Habilitar recorrência mensal
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => { setIsOrigemTypeOpen(false); setOtErrors({}) }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateOrigemType} disabled={isCreatingOrigemType} className="bg-gradient-primary hover:opacity-90">
                    {isCreatingOrigemType ? "Salvando..." : "Cadastrar"}
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

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="entryDate">Data</Label>
        <Input
          id="entryDate"
          type="date"
          value={form.date}
          onChange={(e) => {
            set({ date: e.target.value })
            clearErr("date")
          }}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
      </div>

      {/* Quantidade + Valor Pago */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">
            {isTransfer ? "Pontos Transferidos" : activeTab === "pontos" ? "Pontos Adquiridos" : "Milhas Adquiridas"}
          </Label>
          <Input
            id="amount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              const val = e.target.value
              if (isTransfer && val && sourceAvgCostPerPoint > 0) {
                set({ amount: val, amountPaid: (parseFloat(val) * sourceAvgCostPerPoint).toFixed(2) })
              } else {
                set({ amount: val })
              }
              clearErr("amount")
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          {isTransfer && selectedSourceAccount && (
            <p className={`text-xs ${parseFloat(form.amount || "0") > selectedSourceAccount.balance ? "text-destructive" : "text-muted-foreground"}`}>
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
              Custo de aquisição: {parseFloat(form.amount).toLocaleString("pt-BR")} pts × R$ {sourceAvgCostPerPoint.toFixed(4)} = R$ {(parseFloat(form.amount) * sourceAvgCostPerPoint).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Recorrência */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isRecurrent}
            onChange={(e) => {
              set({ isRecurrent: e.target.checked })
              if (!e.target.checked) {
                // When disabling recurrence, reset to single occurrence
                set({ recurrenceCount: 1, startDate: form.date })
              }
            }}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <Label className="text-sm font-medium">Habilitar recorrência</Label>
        </div>
        {form.isRecurrent && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de recorrência</Label>
                <Select
                  value={form.recurrenceType}
                  onValueChange={(value) => set({ recurrenceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
                    <SelectItem value="quarterly">Trimestral (90 dias)</SelectItem>
                    <SelectItem value="semiannual">Semestral (180 dias)</SelectItem>
                    <SelectItem value="annual">Anual (365 dias)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade de parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.recurrenceCount}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1)
                    set({ recurrenceCount: val })
                  }}
                  className="w-20"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => {
                    set({ startDate: e.target.value })
                  }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span>
                    {form.recurrenceType === "monthly"
                      ? "Mensal"
                      : form.recurrenceType === "quarterly"
                        ? "Trimestral"
                        : form.recurrenceType === "semiannual"
                          ? "Semestral"
                          : "Anual"}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Parcelas:</span>
                  <span>{form.recurrenceCount}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Início:</span>
                  <span>{form.startDate}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Valor por parcela:</span>
                  <span>
                    R$ {(
                      parseFloat(form.amountPaid) / form.recurrenceCount
                    ).toFixed(2)}
                  </span>
                </div>
                {isTransfer && (
                  <div className="flex justify-between mt-1">
                    <span>Quantidade por parcela:</span>
                    <span>
                      {(parseFloat(form.amount) / form.recurrenceCount).toLocaleString("pt-BR", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
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
            {errors.sourceAccountId && <p className="text-xs text-destructive">{errors.sourceAccountId}</p>}
            {selectedSourceAccount && (
              <p className="text-xs text-muted-foreground">Programa: {programName(selectedSourceAccount.programId)}</p>
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
                Milhas recebidas: {effectiveMiles.toLocaleString("pt-BR")} ({parseFloat(form.amount).toLocaleString("pt-BR")} + {form.bonusPercent}%)
              </p>
            )}
          </div>

          {/* Compra no Carrinho */}
          <div className="border border-dashed border-primary/20 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <Label className="font-semibold text-sm cursor-pointer">
                Compra no Carrinho <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pontos Extras</Label>
                <Input type="number" value={form.cartAmount} onChange={(e) => set({ cartAmount: e.target.value })} placeholder="Ex: 10000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Total (R$)</Label>
                <Input type="number" step="0.01" value={form.cartCost} onChange={(e) => set({ cartCost: e.target.value })} placeholder="Ex: 200.00" />
              </div>
            </div>
            {form.cartAmount && parseFloat(form.cartAmount) > 0 && (
              <p className="text-xs text-muted-foreground">
                +{parseFloat(form.cartAmount).toLocaleString("pt-BR")} pts × {parseFloat(form.bonusPercent || "0").toFixed(0)}% bônus ={" "}
                {(parseFloat(form.cartAmount) * (1 + parseFloat(form.bonusPercent || "0") / 100)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} milhas geradas
              </p>
            )}
          </div>
        </>
      )}

      {/* Clube (mantido para compatibilidade, mas pode ser ocultado se recurrencia ativa) */}
      {!form.isRecurrent && form.isClube && (
        <div className="border border-dashed border-amber-400/40 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-amber-500" />
            <Label className="font-semibold text-sm cursor-pointer">
              Recorrência <span className="text-muted-foreground font-normal">(Clube)</span>
            </Label>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Recorrência ativada pelo tipo de origem{ mode === "create" ? " selecionado" : "" }
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
                  ⏳ {new Date(new Date().getTime() + parseInt(form.clubeMeses) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")} — serão geradas {form.clubeMeses} entrada(s) futura(s) com status "Aguardando"
                </p>
              )}
              {mode === "edit" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">⏳ Altere com cuidado — novas entradas futuras serão geradas</p>
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
                R$ {((parseFloat(form.amountPaid) / (isTransfer && effectiveMiles > 0 ? effectiveMiles : parseFloat(form.amount))) * 1000).toFixed(2)}
              </p>
            </div>
            {isTransfer && (
              <div>
                <span className="text-muted-foreground">Milhas recebidas:</span>
                <p className="font-semibold text-success">{effectiveMiles.toLocaleString("pt-BR")}</p>
                {parseFloat(form.cartAmount || "0") > 0 && (
                  <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
                    <p>Da transferência: {(parseFloat(form.amount) * (1 + parseFloat(form.bonusPercent || "0") / 100)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
                    <p>Do carrinho: {(parseFloat(form.cartAmount) * (1 + parseFloat(form.bonusPercent || "0") / 100)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "pontos" && (
              <div>
                <span className="text-muted-foreground">Milhas geradas:</span>
                <p className="font-semibold">{ (parseFloat(form.amount) * parseFloat(form.conversionRate || "1")).toLocaleString("pt-BR") }</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Custo por milha:</span>
              <p className="font-semibold">
                R$ {(parseFloat(form.amountPaid) / (isTransfer ? effectiveMiles : parseFloat(form.amount) * (activeTab === "milhas" ? 1 : parseFloat(form.conversionRate || "1")))).toFixed(4)}
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