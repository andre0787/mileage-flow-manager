import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, Search, Package, RefreshCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { FormDrawer } from "@/components/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonPage, SkeletonMetricCard } from "@/components/SkeletonLoader";
import { useHaptic } from "@/hooks/useHaptic";
import confetti from "canvas-confetti";
import { useDebounce } from "@/hooks/useDebounce";
import { useData } from "@/contexts/DataContext";
import { isTransferencia } from "@/lib/utils";
import { calcMilesGenerated, calcCostPerThousand, calcCostPerMile } from "@/lib/metrics";
import { useAddEntryMutation, useUpdateEntryMutation, useAddOrigemTypeMutation } from "@/hooks/useDatabase";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import type { Program, OrigemType, PointEntry } from "@/types";

export default function Entradas() {
  const { entries, accounts, owners, programs, origemTypes, sales, isLoading } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const addEntryM = useAddEntryMutation();
  const updateEntryM = useUpdateEntryMutation();
  const addOrigemTypeM = useAddOrigemTypeMutation();
  const haptic = useHaptic();

  const [activeTab, setActiveTab] = useState<"pontos" | "milhas">("pontos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PointEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
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
  });
  const [entryErrors, setEntryErrors] = useState<Partial<Record<"accountId" | "origemTypeId" | "amount" | "amountPaid" | "sourceAccountId", string>>>({});

  const [isOrigemTypeDialogOpen, setIsOrigemTypeDialogOpen] = useState(false);
  const [newOrigemType, setNewOrigemType] = useState({ name: "", color: "#10b981" });
  const [origemTypeErrors, setOrigemTypeErrors] = useState<Partial<Record<string, string>>>({});
  const milhasOrigemTypes = origemTypes.filter(ot => ot.accountType === "milhas");
  const currentOrigemTypes = activeTab === "pontos"
    ? programs.filter(p => p.type === "pontos")
    : milhasOrigemTypes;
  const availableAccounts = accounts.filter(a => a.type === activeTab && a.status === "ativa");

  const entriesByTab = useMemo(() => {
    return entries.filter(e => {
      const account = accounts.find(a => a.id === e.accountId);
      return account?.type === activeTab;
    });
  }, [entries, accounts, activeTab]);

  const entriesFiltered = useMemo(() => {
    if (!debouncedSearch) return entriesByTab;
    const q = debouncedSearch.toLowerCase();
    return entriesByTab.filter(e => {
      const account = accounts.find(a => a.id === e.accountId);
      const accountName = account?.name.toLowerCase() ?? "";
      const origemNome = origemTypes.find(ot => ot.id === e.origemTypeId)?.name.toLowerCase()
        ?? programs.find(p => p.id === e.origemTypeId)?.name.toLowerCase() ?? "";
      const dateStr = new Date(e.date).toLocaleDateString('pt-BR');
      return accountName.includes(q) || origemNome.includes(q) || dateStr.includes(q);
    });
  }, [entriesByTab, debouncedSearch, accounts, origemTypes, programs]);

  const selectedAccount = accounts.find(a => a.id === newEntry.accountId);
  const selectedOrigemType = origemTypes.find(ot => ot.id === newEntry.origemTypeId);
  const isTransfer = selectedOrigemType ? isTransferencia(selectedOrigemType) : false;
  const sourceAccounts = accounts.filter(a =>
    a.type === "pontos" && a.status === "ativa" && a.ownerId === selectedAccount?.ownerId
  );
  const selectedSourceAccount = accounts.find(a => a.id === newEntry.sourceAccountId);
  const sourceAvgCostPerPoint = selectedSourceAccount && selectedSourceAccount.balance > 0
    ? (selectedSourceAccount.totalInvested ?? 0) / selectedSourceAccount.balance
    : 0;
  const effectiveMiles = isTransfer && newEntry.amount
    ? (parseFloat(newEntry.amount) + parseFloat(newEntry.cartAmount || "0")) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)
    : parseFloat(newEntry.amount || "0");

  const ownerName = (id: string) => owners.find(o => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find(p => p.id === id)?.name ?? id;
  const origemTypeName = (id: string) => origemTypes.find(ot => ot.id === id)?.name ?? id;

  const handleOpenTransfer = () => {
    const transferId = origemTypes.find((ot) => isTransferencia(ot))?.id ?? "";
    setActiveTab("milhas");
    setNewEntry({
      accountId: "",
      origemTypeId: transferId,
      amount: "",
      amountPaid: "",
      conversionRate: "",
      sourceAccountId: "",
      bonusPercent: "",
      cartAmount: "",
      cartCost: "",
      isClube: false,
      clubeMeses: "",
    });
    setEntryErrors({});
    setIsCreateDialogOpen(true);
  };

  const resetForm = () => {
    setNewEntry({ accountId: "", origemTypeId: "", amount: "", amountPaid: "", conversionRate: "", sourceAccountId: "", bonusPercent: "", cartAmount: "", cartCost: "", isClube: false, clubeMeses: "" });
    setEntryErrors({});
  };

  const openEditDialog = (entry: PointEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      accountId: entry.accountId,
      origemTypeId: entry.origemTypeId,
      amount: String(entry.amount),
      amountPaid: String(entry.amountPaid),
      conversionRate: entry.conversionRate ? String(entry.conversionRate) : "",
      sourceAccountId: entry.sourceAccountId ?? "",
      bonusPercent: entry.bonusPercent ? String(entry.bonusPercent) : "",
      cartAmount: entry.cartAmount ? String(entry.cartAmount) : "",
      cartCost: entry.cartCost ? String(entry.cartCost) : "",
      isClube: !!(entry.recurrenceInterval && entry.recurrenceEnd),
      clubeMeses: entry.recurrenceEnd ? String(Math.ceil((new Date(entry.recurrenceEnd).getTime() - new Date(entry.date).getTime()) / (30 * 24 * 60 * 60 * 1000))) : "",
    });
    setEntryErrors({});
    setIsEditDialogOpen(true);
  };

  const handleUpdateEntry = () => {
    if (!editingEntry || !validateEntry()) return;
    const amount = parseFloat(newEntry.amount);
    const cartAmount = parseFloat(newEntry.cartAmount || "0");
    const amountPaid = parseFloat(newEntry.amountPaid);
    const cartCost = parseFloat(newEntry.cartCost || "0");
    const conversionRate = parseFloat(newEntry.conversionRate || "1");
    const bonusPercent = isTransfer ? parseFloat(newEntry.bonusPercent || "0") : undefined;
    const totalAmount = amount + (isTransfer ? cartAmount : 0);
    const totalPaid = amountPaid + cartCost;
    const milesGenerated = calcMilesGenerated(totalAmount, conversionRate, bonusPercent);
    const costPerThousand = calcCostPerThousand(totalPaid, milesGenerated);
    const costPerMile = calcCostPerMile(totalPaid, milesGenerated);

    updateEntryM.mutate({
      oldEntry: editingEntry,
      updates: {
        accountId: newEntry.accountId,
        origemTypeId: newEntry.origemTypeId,
        amount,
        amountPaid: totalPaid,
        costPerThousand,
        conversionRate: isTransfer ? 1 + parseFloat(newEntry.bonusPercent || "0") / 100 : (activeTab === "milhas" ? undefined : conversionRate),
        milesGenerated,
        costPerMile,
        sourceAccountId: isTransfer ? newEntry.sourceAccountId : undefined,
        bonusPercent: isTransfer ? parseFloat(newEntry.bonusPercent || "0") : undefined,
        cartAmount: isTransfer && cartAmount > 0 ? cartAmount : undefined,
        cartCost: isTransfer && cartCost > 0 ? cartCost : undefined,
        recurrenceInterval: newEntry.isClube ? 30 : undefined,
        recurrenceEnd: newEntry.isClube && newEntry.clubeMeses ? new Date(new Date().getTime() + parseInt(newEntry.clubeMeses) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      },
    });

    resetForm();
    setEditingEntry(null);
    setIsEditDialogOpen(false);
  };

  const handleCreateOrigemType = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!newOrigemType.name.trim()) errs.name = "Nome é obrigatório";
    setOrigemTypeErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const id = crypto.randomUUID();
    addOrigemTypeM.mutate({ id, name: newOrigemType.name.trim(), accountType: "milhas", color: newOrigemType.color });
    setNewEntry({ ...newEntry, origemTypeId: id });

    setNewOrigemType({ name: "", color: "#10b981" });
    setOrigemTypeErrors({});
    setIsOrigemTypeDialogOpen(false);
  };

  const validateEntry = () => {
    const errors: typeof entryErrors = {};
    if (!newEntry.accountId) errors.accountId = "Selecione uma conta";
    if (!newEntry.origemTypeId) errors.origemTypeId = "Selecione o tipo de origem";
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) errors.amount = "Informe a quantidade";
    if (!isTransfer && (!newEntry.amountPaid || parseFloat(newEntry.amountPaid) <= 0)) errors.amountPaid = "Informe o valor pago";
    if (isTransfer && !newEntry.sourceAccountId) errors.sourceAccountId = "Selecione a conta de origem";
    if (isTransfer && newEntry.sourceAccountId && newEntry.accountId) {
      const srcAccount = accounts.find(a => a.id === newEntry.sourceAccountId);
      const dstAccount = accounts.find(a => a.id === newEntry.accountId);
      if (srcAccount && dstAccount && srcAccount.ownerId !== dstAccount.ownerId) {
        errors.sourceAccountId = "Conta de origem deve pertencer ao mesmo dono";
      }
    }
    if (isTransfer && newEntry.sourceAccountId && selectedSourceAccount && parseFloat(newEntry.amount) > selectedSourceAccount.balance) {
      errors.amount = "Saldo insuficiente na conta de origem";
    }
    setEntryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEntry = () => {
    if (!validateEntry()) return;
      const amount = parseFloat(newEntry.amount);
      const cartAmount = parseFloat(newEntry.cartAmount || "0");
      const amountPaid = parseFloat(newEntry.amountPaid);
      const cartCost = parseFloat(newEntry.cartCost || "0");
      const conversionRate = parseFloat(newEntry.conversionRate || "1");
      const bonusPercent = isTransfer ? parseFloat(newEntry.bonusPercent || "0") : undefined;
      const totalAmount = amount + (isTransfer ? cartAmount : 0);
      const totalPaid = amountPaid + cartCost;
      const milesGenerated = calcMilesGenerated(totalAmount, conversionRate, bonusPercent);
      const costPerThousand = calcCostPerThousand(totalPaid, milesGenerated);
      const costPerMile = calcCostPerMile(totalPaid, milesGenerated);

      addEntryM.mutate(
        { id: crypto.randomUUID(),
        accountId: newEntry.accountId,
        origemTypeId: newEntry.origemTypeId,
        amount,
        amountPaid: totalPaid,
        costPerThousand,
        conversionRate: isTransfer ? 1 + parseFloat(newEntry.bonusPercent || "0") / 100 : (activeTab === "milhas" ? undefined : conversionRate),
        milesGenerated,
        costPerMile,
        sourceAccountId: isTransfer ? newEntry.sourceAccountId : undefined,
        bonusPercent: isTransfer ? parseFloat(newEntry.bonusPercent || "0") : undefined,
        cartAmount: isTransfer && cartAmount > 0 ? cartAmount : undefined,
        cartCost: isTransfer && cartCost > 0 ? cartCost : undefined,
        recurrenceInterval: newEntry.isClube ? 30 : undefined,
        recurrenceEnd: newEntry.isClube && newEntry.clubeMeses ? new Date(new Date().getTime() + parseInt(newEntry.clubeMeses) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        date: new Date().toISOString().split('T')[0],
      },
      {
        onSuccess: () => {
          haptic.success();
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#10b981", "#f59e0b"],
          });
        },
      }
    );

      resetForm();
      setEntryErrors({});
      setIsCreateDialogOpen(false);
  };

  const confirmedEntries = useMemo(() => entriesFiltered.filter(e => e.entryStatus !== 'aguardando'), [entriesFiltered]);
  const pendingEntries = useMemo(() => entries.filter(e => e.entryStatus === 'aguardando'), [entries]);
  const totalAmount = confirmedEntries.reduce((s, e) => s + e.amount, 0);
  const totalAmountPaid = confirmedEntries.reduce((s, e) => s + e.amountPaid, 0);
  const totalMilesGenerated = confirmedEntries.reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);
  const averageCostPerMile = totalMilesGenerated > 0 ? totalAmountPaid / totalMilesGenerated : 0;

  if (isLoading) {
    return <SkeletonPage />;
  }

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie aquisição de pontos e milhas
          </p>
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

          <Button variant="outline" className="gap-2 shrink-0" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Entrada
          </Button>
        </div>
      </div>

        <FormDrawer
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetForm();
              setIsCreateDialogOpen(open);
            }}
            title={`Registrar Nova Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
          >
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="entryAccount">Conta</Label>
                <Select value={newEntry.accountId} onValueChange={(value) => { setNewEntry({...newEntry, accountId: value}); setEntryErrors(prev => ({...prev, accountId: ""})); }}>
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
                {entryErrors.accountId && <p className="text-xs text-destructive">{entryErrors.accountId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryType">Tipo de Origem</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={newEntry.origemTypeId} onValueChange={(value) => { setNewEntry({...newEntry, origemTypeId: value}); setEntryErrors(prev => ({...prev, origemTypeId: ""})); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentOrigemTypes.map((item) => {
                          if (activeTab === "pontos") {
                            const p = item as Program;
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            );
                          }
                          const ot = item as OrigemType;
                          return (
                            <SelectItem key={ot.id} value={ot.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ot.color }} />
                                {ot.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeTab === "milhas" && (
                    <FormDrawer
                      open={isOrigemTypeDialogOpen}
                      onOpenChange={(open) => { setIsOrigemTypeDialogOpen(open); if (!open) setOrigemTypeErrors({}); }}
                      title="Novo Tipo de Origem"
                    >
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={newOrigemType.name}
                            onChange={(e) => { setNewOrigemType({...newOrigemType, name: e.target.value}); setOrigemTypeErrors(p => ({...p, name: ""})); }}
                            placeholder="Ex: Cashback"
                          />
                          {origemTypeErrors.name && <p className="text-xs text-destructive">{origemTypeErrors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Cor</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newOrigemType.color }} />
                            <Input
                              type="color"
                              value={newOrigemType.color}
                              onChange={(e) => setNewOrigemType({...newOrigemType, color: e.target.value})}
                              className="w-full h-10 p-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setIsOrigemTypeDialogOpen(false); setOrigemTypeErrors({}); }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateOrigemType} className="bg-gradient-primary hover:opacity-90">
                          Cadastrar
                        </Button>
                      </div>
                    </FormDrawer>
                  )}
                </div>
                {entryErrors.origemTypeId && <p className="text-xs text-destructive">{entryErrors.origemTypeId}</p>}
              </div>

              {selectedAccount && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Programa: </span>
                  <span className="font-medium">{programName(selectedAccount.programId)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {isTransfer ? "Pontos Transferidos" : activeTab === "pontos" ? "Pontos Adquiridos" : "Milhas Adquiridas"}
                  </Label>
                  <Input id="amount" type="number" value={newEntry.amount} onChange={(e) => { const val = e.target.value; if (isTransfer && val && sourceAvgCostPerPoint > 0) { setNewEntry({...newEntry, amount: val, amountPaid: (parseFloat(val) * sourceAvgCostPerPoint).toFixed(2)}); } else { setNewEntry({...newEntry, amount: val}); } setEntryErrors(prev => ({...prev, amount: ""})); }} placeholder="Ex: 100000" />
                  {entryErrors.amount && <p className="text-xs text-destructive">{entryErrors.amount}</p>}
                  {isTransfer && selectedSourceAccount && (
                    <p className={`text-xs ${parseFloat(newEntry.amount || "0") > selectedSourceAccount.balance ? "text-destructive" : "text-muted-foreground"}`}>
                      Saldo disponível: {selectedSourceAccount.balance.toLocaleString('pt-BR')} pontos
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">
                    {isTransfer ? "Custo (calculado)" : "Valor Pago (R$)"}
                  </Label>
                  <Input id="amountPaid" type="number" step="0.01" value={newEntry.amountPaid} disabled={isTransfer} onChange={(e) => { setNewEntry({...newEntry, amountPaid: e.target.value}); setEntryErrors(prev => ({...prev, amountPaid: ""})); }} placeholder="Ex: 450.00" />
                  {entryErrors.amountPaid && <p className="text-xs text-destructive">{entryErrors.amountPaid}</p>}
                  {isTransfer && selectedSourceAccount && newEntry.amount && sourceAvgCostPerPoint > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Custo de aquisição: {parseFloat(newEntry.amount).toLocaleString('pt-BR')} pts × R$ {sourceAvgCostPerPoint.toFixed(4)} = R$ {(parseFloat(newEntry.amount) * sourceAvgCostPerPoint).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {isTransfer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sourceAccount">Conta de Pontos Origem</Label>
                    <Select value={newEntry.sourceAccountId} onValueChange={(value) => { setNewEntry({...newEntry, sourceAccountId: value, amount: "", amountPaid: ""}); setEntryErrors(prev => ({...prev, sourceAccountId: ""})); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta de pontos" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.balance.toLocaleString('pt-BR')} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entryErrors.sourceAccountId && <p className="text-xs text-destructive">{entryErrors.sourceAccountId}</p>}
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
                      value={newEntry.bonusPercent}
                      onChange={(e) => setNewEntry({...newEntry, bonusPercent: e.target.value})}
                      placeholder="Ex: 30"
                    />
                    {newEntry.bonusPercent && parseFloat(newEntry.bonusPercent) > 0 && newEntry.amount && (
                      <p className="text-xs text-success">
                        Milhas recebidas: {effectiveMiles.toLocaleString('pt-BR')} ({parseFloat(newEntry.amount).toLocaleString('pt-BR')} + {parseFloat(newEntry.bonusPercent)}%)
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
                        <Input
                          type="number"
                          value={newEntry.cartAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewEntry({...newEntry, cartAmount: val});
                          }}
                          placeholder="Ex: 10000"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEntry.cartCost}
                          onChange={(e) => setNewEntry({...newEntry, cartCost: e.target.value})}
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </div>
                    {newEntry.cartAmount && parseFloat(newEntry.cartAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{parseFloat(newEntry.cartAmount).toLocaleString('pt-BR')} pts × {(parseFloat(newEntry.bonusPercent || "0")).toFixed(0)}% bonus ={" "}
                        {(parseFloat(newEntry.cartAmount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}{" "}
                        milhas geradas
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Recorrência (Clube) - disponível em ambas abas, só quando não é transferência */}
              {!isTransfer && (
                <div className="border border-dashed border-amber-400/40 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-amber-500" />
                    <Label className="font-semibold text-sm cursor-pointer">
                      Recorrência <span className="text-muted-foreground font-normal">(Clube)</span>
                    </Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isClube"
                        checked={newEntry.isClube}
                        onChange={(e) => setNewEntry({...newEntry, isClube: e.target.checked})}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <Label htmlFor="isClube" className="text-sm cursor-pointer">
                        Gerar recorrência mensal
                      </Label>
                    </div>
                    {newEntry.isClube && (
                      <div className="space-y-2">
                        <Label className="text-xs">Quantidade de meses</Label>
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={newEntry.clubeMeses}
                          onChange={(e) => setNewEntry({...newEntry, clubeMeses: e.target.value})}
                          placeholder="Ex: 12"
                        />
                        {newEntry.clubeMeses && parseInt(newEntry.clubeMeses) > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            ⏳{new Date(new Date().getTime() + parseInt(newEntry.clubeMeses) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')} — serão geradas {newEntry.clubeMeses} entrada(s) futura(s) com status "Aguardando"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "pontos" && (
                <div className="space-y-2">
                  <Label htmlFor="conversion">Taxa de Conversão (Pontos → Milhas)</Label>
                  <Input id="conversion" type="number" step="0.01" value={newEntry.conversionRate} onChange={(e) => setNewEntry({...newEntry, conversionRate: e.target.value})} placeholder="Ex: 1.0" />
                </div>
              )}

              {newEntry.amount && newEntry.amountPaid && (activeTab === "milhas" || newEntry.conversionRate) && (
                <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
                  <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo por milhar:</span>
                      <p className="font-semibold">
                        R$ {((parseFloat(newEntry.amountPaid) / (isTransfer && effectiveMiles > 0 ? effectiveMiles : parseFloat(newEntry.amount))) * 1000).toFixed(2)}
                      </p>
                    </div>
                    {isTransfer && (
                      <div>
                        <span className="text-muted-foreground">Milhas recebidas:</span>
                        <p className="font-semibold text-success">{effectiveMiles.toLocaleString('pt-BR')}</p>
                        {parseFloat(newEntry.cartAmount || "0") > 0 && (
                          <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
                            <p>Da transferência: {(parseFloat(newEntry.amount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            <p>Do carrinho: {(parseFloat(newEntry.cartAmount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === "pontos" && (
                      <div>
                        <span className="text-muted-foreground">Milhas geradas:</span>
                        <p className="font-semibold">{(parseFloat(newEntry.amount) * parseFloat(newEntry.conversionRate || "1")).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Custo por milha:</span>
                      <p className="font-semibold">
                        R$ {(parseFloat(newEntry.amountPaid) / (isTransfer ? effectiveMiles : parseFloat(newEntry.amount) * (activeTab === "milhas" ? 1 : parseFloat(newEntry.conversionRate || "1")))).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }}>Cancelar</Button>
              <Button onClick={handleCreateEntry} className="bg-gradient-primary hover:opacity-90">Registrar Entrada</Button>
            </div>
          </FormDrawer>


      {/* Banner de entradas pendentes do Clube */}
      {pendingEntries.length > 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {pendingEntries.length} entrada(s) pendente(s) de confirmação
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Entradas geradas pelo Clube de {activeTab === "milhas" ? "Milhas" : "Pontos"} aguardando confirmação. Confirme abaixo para atualizar o saldo da conta.
            </p>
          </div>
        </div>
      )}

      {/* Sub-abas Pontos / Milhas */}
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pontos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {totalAmountPaid.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Milhas Geradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{totalMilesGenerated.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio/Milha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {averageCostPerMile.toFixed(4)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card animate-appear animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Histórico de Entradas - Pontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="hidden md:table-cell">Conta</TableHead>
                      <TableHead className="hidden md:table-cell">Origem</TableHead>
                      <TableHead className="hidden md:table-cell">Pontos</TableHead>
                      <TableHead className="hidden md:table-cell">Valor Pago</TableHead>
                      <TableHead className="hidden md:table-cell">Taxa Conv.</TableHead>
                      <TableHead className="hidden md:table-cell">Milhas</TableHead>
                      <TableHead className="hidden md:table-cell">Custo/Milha</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-12">
                          <EmptyState icon={Package} title="Nenhuma entrada de pontos" description="Registre sua primeira aquisição de pontos ou use a busca para filtrar." />
                        </TableCell>
                      </TableRow>
                    ) : entriesFiltered.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="hidden md:table-cell">{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="font-medium">{accounts.find(a => a.id === entry.accountId)?.name}</p>
                          <p className="text-xs text-muted-foreground">{ownerName(accounts.find(a => a.id === entry.accountId)?.ownerId ?? "")}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              {programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"}
                            </Badge>
                            {entry.cartAmount && entry.cartAmount > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                🛒 Carrinho
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{entry.amount.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">{entry.conversionRate ?? "-"}</TableCell>
                        <TableCell className="hidden md:table-cell font-semibold text-success">
                          {(entry.milesGenerated ?? entry.amount).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">R$ {entry.costPerMile.toFixed(4)}</TableCell>
<TableCell className="hidden md:table-cell text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => openEditDialog(entry)}>
                              Editar
                            </Button>
                            <DeleteEntryDialog entry={entry} />
                          </div>
                        </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

               {/* Mobile card list - Pontos */}
               <div className="md:hidden space-y-3 mt-4">
                 {entriesFiltered.length === 0 ? (
                   <EmptyState icon={Package} title="Nenhuma entrada de pontos" description="Registre sua primeira aquisição de pontos ou use a busca para filtrar." />
                 ) : entriesFiltered.map((entry) => (
                   <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                     <div className="flex items-center justify-between">
                       <div>
                       <div className="flex items-center gap-1">
                         <p className="font-medium">{programs.find(p => p.id === entry.origemTypeId)?.name ?? "-"}</p>
                         {entry.cartAmount && entry.cartAmount > 0 && (
                           <Badge variant="secondary" className="text-[10px] h-5 gap-1">🛒 Carrinho</Badge>
                         )}
                       </div>
                       <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <Badge variant="outline">{accounts.find(a => a.id === entry.accountId)?.name}</Badge>
                    {entry.recurrenceInterval && entry.entryStatus !== 'aguardando' && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] gap-1">🔄 Clube</Badge>
                    )}
                    {entry.entryStatus === 'aguardando' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] gap-1">⏳ Aguardando</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pontos:</span>
                        <p className="font-semibold">{entry.amount.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Pago:</span>
                        <p className="font-semibold">R$ {entry.amountPaid.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Milhas Geradas:</span>
                        <p className="font-semibold text-success">{(entry.milesGenerated ?? entry.amount).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo/Milha:</span>
                        <p className="font-semibold">R$ {entry.costPerMile.toFixed(4)}</p>
                      </div>
                    </div>
<div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => openEditDialog(entry)}>
                        Editar
                      </Button>
                      <DeleteEntryDialog entry={entry} />
                    </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>

         <TabsContent value="milhas" className="space-y-4 animate-appear">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-200">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Milhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalAmount.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor Investido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {totalAmountPaid.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Custo Médio/Milha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">R$ {averageCostPerMile.toFixed(4)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card animate-appear animate-delay-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-primary" />
                Histórico de Entradas - Milhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="hidden md:table-cell">Conta</TableHead>
                      <TableHead className="hidden md:table-cell">Origem</TableHead>
                      <TableHead className="hidden md:table-cell">Milhas</TableHead>
                      <TableHead className="hidden md:table-cell">Valor Pago</TableHead>
                      <TableHead className="hidden md:table-cell">Custo/Milha</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entriesFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12">
                          <EmptyState icon={Package} title="Nenhuma entrada de milhas" description="Registre sua primeira aquisição de milhas ou use a busca para filtrar." />
                        </TableCell>
                      </TableRow>
                    ) : entriesFiltered.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="hidden md:table-cell">{new Date(entry.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="font-medium">{accounts.find(a => a.id === entry.accountId)?.name}</p>
                          <p className="text-xs text-muted-foreground">{ownerName(accounts.find(a => a.id === entry.accountId)?.ownerId ?? "")}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: origemTypes.find(ot => ot.id === entry.origemTypeId)?.color }} />
                              {origemTypeName(entry.origemTypeId)}
                            </Badge>
                            {entry.cartAmount && entry.cartAmount > 0 && (
                              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                                🛒 Carrinho
                              </Badge>
                            )}
                            {entry.recurrenceInterval && entry.entryStatus !== 'aguardando' && (
                              <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                🔄 Clube
                              </Badge>
                            )}
                            {entry.entryStatus === 'aguardando' && (
                              <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                ⏳ Aguardando
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{entry.amount.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">R$ {entry.amountPaid.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="hidden md:table-cell">R$ {entry.costPerMile.toFixed(4)}</TableCell>
<TableCell className="hidden md:table-cell text-right">
                          <div className="flex gap-2 justify-end">
                            {entry.entryStatus === 'aguardando' && (
                              <Button size="sm" variant="outline" className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700" onClick={() => confirmEntryM.mutate(entry)}>
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                Confirmar
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => openEditDialog(entry)}>
                              Editar
                            </Button>
                            <DeleteEntryDialog entry={entry} />
                          </div>
                        </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>

               {/* Mobile card list - Milhas */}
               <div className="md:hidden space-y-3 mt-4">
                 {entriesFiltered.length === 0 ? (
                   <EmptyState icon={Package} title="Nenhuma entrada de milhas" description="Registre sua primeira aquisição de milhas ou use a busca para filtrar." />
                 ) : entriesFiltered.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                      <div className="flex items-center gap-1">
                        <p className="font-medium">{origemTypeName(entry.origemTypeId)}</p>
                        {entry.cartAmount && entry.cartAmount > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">🛒 Carrinho</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Badge variant="outline">{accounts.find(a => a.id === entry.accountId)?.name}</Badge>
                    {entry.recurrenceInterval && entry.entryStatus !== 'aguardando' && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] gap-1">🔄 Clube</Badge>
                    )}
                    {entry.entryStatus === 'aguardando' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] gap-1">⏳ Aguardando</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Milhas:</span>
                      <p className="font-semibold">{entry.amount.toLocaleString('pt-BR')}</p>
                    </div>
                      <div>
                        <span className="text-muted-foreground">Valor Pago:</span>
                        <p className="font-semibold">R$ {entry.amountPaid.toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo/Milha:</span>
                        <p className="font-semibold">R$ {entry.costPerMile.toFixed(4)}</p>
                      </div>
                    </div>
<div className="flex flex-wrap justify-end gap-2 pt-1">
                      {entry.entryStatus === 'aguardando' && (
                        <Button size="sm" variant="outline" className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700" onClick={() => confirmEntryM.mutate(entry)}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Confirmar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="px-3 min-h-[44px]" onClick={() => openEditDialog(entry)}>
                        Editar
                      </Button>
                      <DeleteEntryDialog entry={entry} />
                    </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

       {/* Edit Drawer */}
        <FormDrawer
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              if (!open) { resetForm(); setEditingEntry(null); }
              setIsEditDialogOpen(open);
            }}
            title={`Editar Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
          >
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="editEntryAccount">Conta</Label>
                <Select value={newEntry.accountId} onValueChange={(value) => { setNewEntry({...newEntry, accountId: value}); setEntryErrors(prev => ({...prev, accountId: ""})); }}>
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
                {entryErrors.accountId && <p className="text-xs text-destructive">{entryErrors.accountId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEntryType">Tipo de Origem</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={newEntry.origemTypeId} onValueChange={(value) => { setNewEntry({...newEntry, origemTypeId: value}); setEntryErrors(prev => ({...prev, origemTypeId: ""})); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentOrigemTypes.map((item) => {
                          if (activeTab === "pontos") {
                            const p = item as Program;
                            return (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            );
                          }
                          const ot = item as OrigemType;
                          return (
                            <SelectItem key={ot.id} value={ot.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ot.color }} />
                                {ot.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeTab === "milhas" && (
                    <FormDrawer
                      open={isOrigemTypeDialogOpen}
                      onOpenChange={(open) => { setIsOrigemTypeDialogOpen(open); if (!open) setOrigemTypeErrors({}); }}
                      title="Novo Tipo de Origem"
                    >
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            value={newOrigemType.name}
                            onChange={(e) => { setNewOrigemType({...newOrigemType, name: e.target.value}); setOrigemTypeErrors(p => ({...p, name: ""})); }}
                            placeholder="Ex: Cashback"
                          />
                          {origemTypeErrors.name && <p className="text-xs text-destructive">{origemTypeErrors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label>Cor</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newOrigemType.color }} />
                            <Input
                              type="color"
                              value={newOrigemType.color}
                              onChange={(e) => setNewOrigemType({...newOrigemType, color: e.target.value})}
                              className="w-full h-10 p-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setIsOrigemTypeDialogOpen(false); setOrigemTypeErrors({}); }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateOrigemType} className="bg-gradient-primary hover:opacity-90">
                          Cadastrar
                        </Button>
                      </div>
                    </FormDrawer>
                  )}
                </div>
                {entryErrors.origemTypeId && <p className="text-xs text-destructive">{entryErrors.origemTypeId}</p>}
              </div>

              {selectedAccount && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Programa: </span>
                  <span className="font-medium">{programName(selectedAccount.programId)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editAmount">
                    {isTransfer ? "Pontos Transferidos" : activeTab === "pontos" ? "Pontos Adquiridos" : "Milhas Adquiridas"}
                  </Label>
                  <Input id="editAmount" type="number" value={newEntry.amount} onChange={(e) => { const val = e.target.value; if (isTransfer && val && sourceAvgCostPerPoint > 0) { setNewEntry({...newEntry, amount: val, amountPaid: (parseFloat(val) * sourceAvgCostPerPoint).toFixed(2)}); } else { setNewEntry({...newEntry, amount: val}); } setEntryErrors(prev => ({...prev, amount: ""})); }} placeholder="Ex: 100000" />
                  {entryErrors.amount && <p className="text-xs text-destructive">{entryErrors.amount}</p>}
                  {isTransfer && selectedSourceAccount && (
                    <p className={`text-xs ${parseFloat(newEntry.amount || "0") > selectedSourceAccount.balance ? "text-destructive" : "text-muted-foreground"}`}>
                      Saldo disponível: {selectedSourceAccount.balance.toLocaleString('pt-BR')} pontos
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAmountPaid">
                    {isTransfer ? "Custo (calculado)" : "Valor Pago (R$)"}
                  </Label>
                  <Input id="editAmountPaid" type="number" step="0.01" value={newEntry.amountPaid} disabled={isTransfer} onChange={(e) => { setNewEntry({...newEntry, amountPaid: e.target.value}); setEntryErrors(prev => ({...prev, amountPaid: ""})); }} placeholder="Ex: 450.00" />
                  {entryErrors.amountPaid && <p className="text-xs text-destructive">{entryErrors.amountPaid}</p>}
                  {isTransfer && selectedSourceAccount && newEntry.amount && sourceAvgCostPerPoint > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Custo de aquisição: {parseFloat(newEntry.amount).toLocaleString('pt-BR')} pts × R$ {sourceAvgCostPerPoint.toFixed(4)} = R$ {(parseFloat(newEntry.amount) * sourceAvgCostPerPoint).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {isTransfer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editSourceAccount">Conta de Pontos Origem</Label>
                    <Select value={newEntry.sourceAccountId} onValueChange={(value) => { setNewEntry({...newEntry, sourceAccountId: value, amount: "", amountPaid: ""}); setEntryErrors(prev => ({...prev, sourceAccountId: ""})); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a conta de pontos" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.balance.toLocaleString('pt-BR')} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entryErrors.sourceAccountId && <p className="text-xs text-destructive">{entryErrors.sourceAccountId}</p>}
                    {selectedSourceAccount && (
                      <p className="text-xs text-muted-foreground">
                        Programa: {programName(selectedSourceAccount.programId)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editBonus">Bonificação (%)</Label>
                    <Input
                      id="editBonus"
                      type="number"
                      step="0.1"
                      min="0"
                      value={newEntry.bonusPercent}
                      onChange={(e) => setNewEntry({...newEntry, bonusPercent: e.target.value})}
                      placeholder="Ex: 30"
                    />
                    {newEntry.bonusPercent && parseFloat(newEntry.bonusPercent) > 0 && newEntry.amount && (
                      <p className="text-xs text-success">
                        Milhas recebidas: {effectiveMiles.toLocaleString('pt-BR')} ({parseFloat(newEntry.amount).toLocaleString('pt-BR')} + {parseFloat(newEntry.bonusPercent)}%)
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
                        <Input
                          type="number"
                          value={newEntry.cartAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewEntry({...newEntry, cartAmount: val});
                          }}
                          placeholder="Ex: 10000"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newEntry.cartCost}
                          onChange={(e) => setNewEntry({...newEntry, cartCost: e.target.value})}
                          placeholder="Ex: 200.00"
                        />
                      </div>
                    </div>
                    {newEntry.cartAmount && parseFloat(newEntry.cartAmount) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{parseFloat(newEntry.cartAmount).toLocaleString('pt-BR')} pts × {(parseFloat(newEntry.bonusPercent || "0")).toFixed(0)}% bonus ={" "}
                        {(parseFloat(newEntry.cartAmount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}{" "}
                        milhas geradas
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Recorrência (Clube) - edit */}
              {!isTransfer && (
                <div className="border border-dashed border-amber-400/40 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-amber-500" />
                    <Label className="font-semibold text-sm cursor-pointer">
                      Recorrência <span className="text-muted-foreground font-normal">(Clube)</span>
                    </Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editIsClube"
                        checked={newEntry.isClube}
                        onChange={(e) => setNewEntry({...newEntry, isClube: e.target.checked})}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <Label htmlFor="editIsClube" className="text-sm cursor-pointer">
                        Gerar recorrência mensal
                      </Label>
                    </div>
                    {newEntry.isClube && (
                      <div className="space-y-2">
                        <Label className="text-xs">Quantidade de meses</Label>
                        <Input
                          id="editClubeMeses"
                          type="number"
                          min="1"
                          max="120"
                          value={newEntry.clubeMeses}
                          onChange={(e) => setNewEntry({...newEntry, clubeMeses: e.target.value})}
                          placeholder="Ex: 12"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⏳ Altere com cuidado — novas entradas futuras serão geradas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "pontos" && (
                <div className="space-y-2">
                  <Label htmlFor="editConversion">Taxa de Conversão (Pontos → Milhas)</Label>
                  <Input id="editConversion" type="number" step="0.01" value={newEntry.conversionRate} onChange={(e) => setNewEntry({...newEntry, conversionRate: e.target.value})} placeholder="Ex: 1.0" />
                </div>
              )}

              {newEntry.amount && newEntry.amountPaid && (activeTab === "milhas" || newEntry.conversionRate) && (
                <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
                  <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo por milhar:</span>
                      <p className="font-semibold">
                        R$ {((parseFloat(newEntry.amountPaid) / (isTransfer && effectiveMiles > 0 ? effectiveMiles : parseFloat(newEntry.amount))) * 1000).toFixed(2)}
                      </p>
                    </div>
                    {isTransfer && (
                      <div>
                        <span className="text-muted-foreground">Milhas recebidas:</span>
                        <p className="font-semibold text-success">{effectiveMiles.toLocaleString('pt-BR')}</p>
                        {parseFloat(newEntry.cartAmount || "0") > 0 && (
                          <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
                            <p>Da transferência: {(parseFloat(newEntry.amount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            <p>Do carrinho: {(parseFloat(newEntry.cartAmount) * (1 + parseFloat(newEntry.bonusPercent || "0") / 100)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === "pontos" && (
                      <div>
                        <span className="text-muted-foreground">Milhas geradas:</span>
                        <p className="font-semibold">{(parseFloat(newEntry.amount) * parseFloat(newEntry.conversionRate || "1")).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Custo por milha:</span>
                      <p className="font-semibold">
                        R$ {(parseFloat(newEntry.amountPaid) / (isTransfer ? effectiveMiles : parseFloat(newEntry.amount) * (activeTab === "milhas" ? 1 : parseFloat(newEntry.conversionRate || "1")))).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { resetForm(); setEditingEntry(null); setIsEditDialogOpen(false); }}>Cancelar</Button>
              <Button onClick={handleUpdateEntry} className="bg-gradient-primary hover:opacity-90">Salvar Alterações</Button>
            </div>
          </FormDrawer>
     </div>
   );
 }
