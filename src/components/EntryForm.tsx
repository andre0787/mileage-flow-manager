import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDrawer } from "@/components/FormDrawer"
import { isTransferencia } from "@/lib/utils"
import type { Account, OrigemType, Program, Owner, EntryFormData } from "@/types"

interface EntryFormProps {
  type: "milhas" | "pontos"
  mode: "create" | "edit"
  initialData?: Partial<EntryFormData>
  onSubmit: (data: EntryFormData) => void
  onCancel: () => void
  accounts: Account[]
  origemTypes: OrigemType[]
  programs: Program[]
  owners: Owner[]
  onCreateOrigemType?: (data: { name: string; color: string }) => Promise<string | undefined>
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
  date: "",
  isRecurrent: false,
  recurrenceType: "monthly",
  recurrenceCount: 1,
  startDate: "",
  recurrenceValueMode: "split",
}

export function EntryForm({
  type,
  mode,
  initialData,
  onSubmit,
  onCancel,
  accounts,
  origemTypes,
  programs,
  owners,
  onCreateOrigemType,
}: EntryFormProps) {
  const [form, setForm] = useState<EntryFormData>({ ...emptyForm, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [isOrigemTypeOpen, setIsOrigemTypeOpen] = useState(false)
  const [newOT, setNewOT] = useState({ name: "", color: "#10b981" })
  const [isCreatingOrigemType, setIsCreatingOrigemType] = useState(false)
  const [otErrors, setOtErrors] = useState<Partial<Record<string, string>>>({})

  const set = (patch: Partial<EntryFormData>) => setForm((prev) => ({ ...prev, ...patch }))
  const clearErr = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }))

  const selectedAccount = accounts.find((a) => a.id === form.accountId)
  const availableAccounts = accounts.filter((a) => a.type === type && a.status === "ativa")
  const currentOrigemTypes = origemTypes.filter((ot) => ot.accountType === type && !isTransferencia(ot))

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id

  const label = type === "milhas" ? "Milhas" : "Pontos"

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.accountId) errs.accountId = "Selecione uma conta"
    if (!form.origemTypeId) errs.origemTypeId = "Selecione o tipo de origem"
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Informe a quantidade"
    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) errs.amountPaid = "Informe o valor pago"
    if (!form.date) errs.date = "Selecione a data"
    if (form.isRecurrent) {
      if (form.recurrenceCount < 2) errs.recurrenceCount = "Mínimo de 2 parcelas para gerar recorrência"
      if (!form.startDate) errs.startDate = "Selecione a data de início"
    }
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
      if (id) set({ origemTypeId: id })
      setNewOT({ name: "", color: "#10b981", hasRecurrence: false })
      setOtErrors({})
      setIsOrigemTypeOpen(false)
    } finally {
      setIsCreatingOrigemType(false)
    }
  }

  const milesGenerated = parseFloat(form.amount) * parseFloat(form.conversionRate || "1")
  const costPerMile = parseFloat(form.amountPaid) / (milesGenerated || 1)
  const costPerThousand = (parseFloat(form.amountPaid) / parseFloat(form.amount)) * 1000

  return (
    <div className="grid gap-4 py-4 max-h-[70dvh] sm:max-h-[60dvh] overflow-y-auto">
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
                set({ origemTypeId: value })
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
                <div className="grid gap-4 py-4 max-h-[70dvh] sm:max-h-[60dvh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={newOT.name}
                      onChange={(e) => {
                        setNewOT((p) => ({ ...p, name: e.target.value }))
                        setOtErrors((p) => ({ ...p, name: "" }))
                      }}
                      placeholder={`Ex: ${type === "milhas" ? "Compra Direta" : "Cashback"}`}
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
          <Label htmlFor="amount">{label} Adquiridos</Label>
          <Input
            id="amount"
            type="number"
            value={form.amount}
            onChange={(e) => {
              set({ amount: e.target.value })
              clearErr("amount")
            }}
            placeholder="Ex: 100000"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amountPaid">Valor Pago (R$)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={form.amountPaid}
            onChange={(e) => {
              set({ amountPaid: e.target.value })
              clearErr("amountPaid")
            }}
            placeholder="Ex: 450.00"
          />
          {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid}</p>}
        </div>
      </div>

      {/* Recorrência */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isRecurrent}
            onChange={(e) => {
              set({
                isRecurrent: e.target.checked,
                startDate: e.target.checked && !form.startDate ? new Date().toISOString().split('T')[0] : form.startDate,
              })
              if (!e.target.checked) {
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
                  onValueChange={(value) => set({ recurrenceType: value as EntryFormData["recurrenceType"] })}
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
                  min="2"
                  value={String(form.recurrenceCount)}
                  onChange={(e) => {
                    const val = Math.max(2, parseInt(e.target.value) || 1)
                    set({ recurrenceCount: val })
                    clearErr('recurrenceCount')
                  }}
                  className="w-20"
                />
                {errors.recurrenceCount && <p className="text-xs text-destructive">{errors.recurrenceCount}</p>}
              </div>
              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => {
                    set({ startDate: e.target.value })
                    clearErr('startDate')
                  }}
                />
                {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Modo de repetição</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recurrenceValueMode"
                    checked={form.recurrenceValueMode === "split"}
                    onChange={() => set({ recurrenceValueMode: "split" })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Parcelado (valor / parcelas)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recurrenceValueMode"
                    checked={form.recurrenceValueMode === "repeat"}
                    onChange={() => set({ recurrenceValueMode: "repeat" })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Repetido (mesmo valor em cada)</span>
                </label>
              </div>
            </div>
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
                {form.recurrenceValueMode === "split" && (
                  <div className="flex justify-between mt-1">
                    <span>Valor por parcela:</span>
                    <span>
                      R$ {(parseFloat(form.amountPaid) / form.recurrenceCount).toFixed(2)}
                    </span>
                  </div>
                )}
                {form.recurrenceValueMode === "repeat" && (
                  <div className="flex justify-between mt-1">
                    <span>Valor por parcela:</span>
                    <span>R$ {parseFloat(form.amountPaid).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Taxa de Conversão (só para Pontos) */}
      {type === "pontos" && (
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
      {form.amount && form.amountPaid && (
        <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
          <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
          <div className={type === "pontos" ? "grid grid-cols-3 gap-4 text-xs" : "grid grid-cols-2 gap-4 text-xs"}>
            <div>
              <span className="text-muted-foreground">Custo por milhar:</span>
              <p className="font-semibold">R$ {costPerThousand.toFixed(2)}</p>
            </div>
            {type === "pontos" && (
              <div>
                <span className="text-muted-foreground">Milhas geradas:</span>
                <p className="font-semibold">{milesGenerated.toLocaleString("pt-BR")}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Custo por milha:</span>
              <p className="font-semibold">R$ {costPerMile.toFixed(4)}</p>
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
