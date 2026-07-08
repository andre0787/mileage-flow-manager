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
