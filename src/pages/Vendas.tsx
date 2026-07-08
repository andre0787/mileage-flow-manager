import { useState, useMemo } from "react";
import { Plus, TrendingDown, Users, Search, Calculator, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FormDrawer } from "@/components/FormDrawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { useHaptic } from "@/hooks/useHaptic";
import confetti from "canvas-confetti";
import { useData } from "@/contexts/DataContext";
import { useAddSaleMutation, useUpdateSaleMutation, useCancelSaleMutation, useAddClientMutation } from "@/hooks/useDatabase";
import { formatCPF } from "@/lib/utils";
import type { Sale } from "@/types";

interface StockInfo {
  accountId: string;
  ownerId: string;
  ownerName: string;
  accountName: string;
  programId: string;
  program: string;
  availableMiles: number;
  averageCostPerMile: number;
}

export default function Vendas() {
  const { clients, accounts, owners, programs, sales, isLoading } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simInputs, setSimInputs] = useState({
    accountId: "",
    miles: "",
    pricePerMile: "",
    costPerMile: "",
    additionalCost: "",
  });

  const addSaleM = useAddSaleMutation();
  const updateSaleM = useUpdateSaleMutation();
  const cancelSaleM = useCancelSaleMutation();
  const addClientM = useAddClientMutation();
  const haptic = useHaptic();

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
        averageCostPerMile: a.averageCostPerMile ?? 0
      }));
  }, [accounts, owners, programs]);

  const createEmptyPassenger = () => ({
    name: "",
    passengerId: crypto.randomUUID(),
    cpf: "",
    clientId: undefined as string | undefined
  });

  const [newSale, setNewSale] = useState({
    ownerName: "",
    accountId: "",
    accountName: "",
    program: "",
    clientId: "",
    clientName: "",
    milesUsed: "",
    pricePerMile: "",
    saleValue: "",
    additionalCost: "",
    additionalCostDesc: "",
    ticketLocator: "",
    passengers: [createEmptyPassenger()]
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    telegram: ""
  });

  const simResults = useMemo(() => {
    const miles = parseFloat(simInputs.miles) || 0;
    const price = parseFloat(simInputs.pricePerMile) || 0;
    const cost = parseFloat(simInputs.costPerMile) || 0;
    const addCost = parseFloat(simInputs.additionalCost) || 0;
    const saleValue = miles * price;
    const totalCost = miles * cost + addCost;
    const profit = saleValue - totalCost;
    const margin = saleValue > 0 ? (profit / saleValue) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    return { saleValue, totalCost, profit, margin, roi };
  }, [simInputs]);

  const handleSelectSimAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    setSimInputs({
      ...simInputs,
      accountId,
      costPerMile: account ? String(account.averageCostPerMile ?? 0) : "",
    });
  };

  const ownersList = [...new Set(stockInfo.map(s => s.ownerName))];
  const selectedOwnerStock = stockInfo.filter(s => s.ownerName === newSale.ownerName);
  const selectedProgramStock = stockInfo.find((s) => s.accountId === newSale.accountId);

  const programConfig = programs.find((p) => p.id === selectedProgramStock?.programId);

  const usedPassengersInCycle = useMemo(() => {
    if (!programConfig?.passengerCycleType || !programConfig?.maxPassengers) return 0;
    
    let relevantSales = sales.filter(s => s.program === newSale.program);
    
    if (programConfig.passengerCycleType === "anual") {
      const currentYear = new Date().getFullYear();
      relevantSales = relevantSales.filter(s => new Date(s.date).getFullYear() === currentYear);
    } else if (programConfig.passengerCycleType === "dias" && programConfig.passengerCycleDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - programConfig.passengerCycleDays);
      cutoff.setHours(0, 0, 0, 0);
      relevantSales = relevantSales.filter(s => new Date(s.date) >= cutoff);
    }
    
    return relevantSales.reduce((sum, s) => sum + s.passengers.length, 0);
  }, [sales, newSale.program, programConfig]);

  const [clientErrors, setClientErrors] = useState<Partial<Record<string, string>>>({});

  const handleCreateClient = () => {
    const errs: Partial<Record<string, string>> = {};
    if (!newClient.name.trim()) errs.name = "Nome é obrigatório";
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const id = crypto.randomUUID();
    addClientM.mutate({ id,
      name: newClient.name.trim(),
      cpf: newClient.cpf,
      email: newClient.email.trim(),
      phone: newClient.phone,
      telegram: newClient.telegram,
      totalPurchases: 0,
      usageHistory: []
    }, id);

    setNewSale({
      ...newSale,
      clientId: id,
      clientName: newClient.name.trim()
    });

    setNewClient({ name: "", cpf: "", email: "", phone: "", telegram: "" });
    setClientErrors({});
    setIsClientDialogOpen(false);
  };

  const handleCreateSale = () => {
    if (newSale.ownerName && newSale.accountId && newSale.program && newSale.clientId && newSale.milesUsed && newSale.saleValue) {
      const milesUsed = parseFloat(newSale.milesUsed);
      const saleValue = parseFloat(newSale.saleValue);
      const additionalCost = parseFloat(newSale.additionalCost || "0");
      const costPerMile = selectedProgramStock?.averageCostPerMile || 0;
      const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
      const profitMargin = calcProfitMargin(profit, saleValue);

      addSaleM.mutate(
        { id: crypto.randomUUID(),
        accountId: newSale.accountId,
        ownerName: newSale.ownerName,
        accountName: newSale.accountName,
        program: newSale.program,
        clientId: newSale.clientId,
        clientName: newSale.clientName,
        milesUsed,
        saleValue,
        pricePerMile: parseFloat(newSale.pricePerMile || "0") || undefined,
        additionalCost: additionalCost || undefined,
        additionalCostDesc: newSale.additionalCostDesc.trim() || undefined,
        costPerMile,
        profit,
        profitMargin,
        status: "pendente",
        ticketLocator: newSale.ticketLocator,
        passengers: newSale.passengers.filter(p => p.name.trim()),
        date: new Date().toISOString().split('T')[0]
      },
      {
        onSuccess: () => {
          haptic.success();
          if (saleValue >= 200) {
            confetti({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#6366f1", "#f59e0b", "#10b981"],
            });
          }
        },
      }
    );



      setNewSale({
        ownerName: "",
        accountId: "",
        accountName: "",
        program: "",
        clientId: "",
        clientName: "",
        milesUsed: "",
        pricePerMile: "",
        saleValue: "",
        additionalCost: "",
        additionalCostDesc: "",
        ticketLocator: "",
        passengers: [createEmptyPassenger()]
      });
      setIsCreateDialogOpen(false);
    }
  };

  const addPassenger = () => {
    setNewSale({
      ...newSale,
      passengers: [...newSale.passengers, createEmptyPassenger()]
    });
  };

  const updatePassenger = (index: number, field: string, value: string) => {
    const updatedPassengers = newSale.passengers.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    );
    setNewSale({ ...newSale, passengers: updatedPassengers });
  };

  const removePassenger = (index: number) => {
    if (newSale.passengers.length > 1) {
      setNewSale({
        ...newSale,
        passengers: newSale.passengers.filter((_, i) => i !== index)
      });
    }
  };

  const updateSaleStatus = (id: string, status: Sale['status']) => {
    updateSaleM.mutate({ id, status });
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (statusFilter !== "todos" && s.status !== statusFilter) return false;
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        s.clientName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q) ||
        s.ticketLocator.toLowerCase().includes(q)
      );
    });
  }, [sales, statusFilter, debouncedSearch]);

  const activeSales = filteredSales.filter(s => s.status !== 'cancelado');
  const totalRevenue = activeSales.reduce((sum, sale) => sum + sale.saleValue, 0);
  const totalProfit = activeSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalMilesSold = activeSales.reduce((sum, sale) => sum + sale.milesUsed, 0);
  const averageProfitMargin = activeSales.length > 0 ? 
    activeSales.reduce((sum, sale) => sum + sale.profitMargin, 0) / activeSales.length : 0;

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
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas de Milhas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as vendas de milhas e controle de estoque por dono
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 w-full sm:w-56"
              placeholder="Buscar venda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
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
              <Calculator className="h-4 w-4" />
              Simular
            </Button>
            <Button className="flex-1 sm:flex-none gap-2 bg-gradient-primary hover:opacity-90" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova Venda
            </Button>
          </div>
        </div>
      </div>

         <FormDrawer
           open={isCreateDialogOpen}
           onOpenChange={setIsCreateDialogOpen}
           title="Registrar Nova Venda"
         >
           <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Dono da Conta</Label>
                  <Select value={newSale.ownerName} onValueChange={(value) => setNewSale({...newSale, ownerName: value, accountId: "", accountName: "", program: ""})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dono" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownersList.map((owner) => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Conta / Programa</Label>
                  <Select 
                    value={newSale.accountId} 
                    onValueChange={(value) => {
                      const stock = selectedOwnerStock.find((item) => item.accountId === value);
                      setNewSale({
                        ...newSale,
                        accountId: value,
                        accountName: stock?.accountName ?? "",
                        program: stock?.program ?? "",
                      });
                    }}
                    disabled={!newSale.ownerName}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedOwnerStock.map((stock) => (
                        <SelectItem key={stock.accountId} value={stock.accountId}>
                          {stock.program} — {stock.accountName} ({stock.availableMiles.toLocaleString('pt-BR')} milhas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProgramStock && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Informações do Estoque:</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Milhas disponíveis:</span>
                      <p className="font-semibold">{selectedProgramStock.availableMiles.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo médio por milha:</span>
                      <p className="font-semibold">R$ {selectedProgramStock.averageCostPerMile.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={newSale.clientId}
                        onValueChange={(value) => {
                          const client = clients.find(c => c.id === value);
                          setNewSale({
                            ...newSale,
                            clientId: value,
                            clientName: client?.name || ""
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)} title="Novo cliente">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locator">Localizador do Bilhete</Label>
                  <Input
                    id="locator"
                    value={newSale.ticketLocator}
                    onChange={(e) => setNewSale({...newSale, ticketLocator: e.target.value})}
                    placeholder="Ex: ABC123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="miles">Milhas Utilizadas</Label>
                  <Input
                    id="miles"
                    type="number"
                    value={newSale.milesUsed}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && newSale.pricePerMile) {
                        setNewSale({...newSale, milesUsed: val, saleValue: (parseFloat(val) * parseFloat(newSale.pricePerMile)).toFixed(2)});
                      } else {
                        setNewSale({...newSale, milesUsed: val});
                      }
                    }}
                    placeholder="Ex: 50000"
                    max={selectedProgramStock?.availableMiles}
                  />
                  {selectedProgramStock && (
                    <p className="text-xs text-muted-foreground">
                      Estoque: {selectedProgramStock.availableMiles.toLocaleString('pt-BR')} milhas
                    </p>
                  )}
                  {newSale.milesUsed && selectedProgramStock && parseFloat(newSale.milesUsed) > selectedProgramStock.availableMiles && (
                    <p className="text-xs text-destructive">Quantidade superior ao estoque disponível</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerMile">Valor por Milha (R$)</Label>
                  <Input
                    id="pricePerMile"
                    type="number"
                    step="0.0001"
                    value={newSale.pricePerMile}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && newSale.milesUsed) {
                        setNewSale({...newSale, pricePerMile: val, saleValue: (parseFloat(val) * parseFloat(newSale.milesUsed)).toFixed(2)});
                      } else {
                        setNewSale({...newSale, pricePerMile: val});
                      }
                    }}
                    placeholder="Ex: 0.03"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Valor da Venda (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={newSale.saleValue}
                    onChange={(e) => setNewSale({...newSale, saleValue: e.target.value})}
                    placeholder="Ex: 300.00"
                  />
                  {newSale.pricePerMile && newSale.milesUsed && (
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(newSale.milesUsed).toLocaleString('pt-BR')} × R$ {parseFloat(newSale.pricePerMile).toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalCost">Custo Adicional (R$)</Label>
                  <Input
                    id="additionalCost"
                    type="number"
                    step="0.01"
                    value={newSale.additionalCost}
                    onChange={(e) => setNewSale({...newSale, additionalCost: e.target.value})}
                    placeholder="Ex: 50.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additionalCostDesc">Observação do Custo</Label>
                  <Input
                    id="additionalCostDesc"
                    value={newSale.additionalCostDesc}
                    onChange={(e) => setNewSale({...newSale, additionalCostDesc: e.target.value})}
                    placeholder="Ex: Taxa de embarque"
                  />
                </div>
              </div>

              {newSale.milesUsed && newSale.saleValue && selectedProgramStock && (
                <div className="p-3 bg-success-light rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Custo total:</span>
                      <p className="font-semibold">R$ {(parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile).toFixed(2)}</p>
                    </div>
                    {newSale.additionalCost && parseFloat(newSale.additionalCost) > 0 && (
                      <div>
                        <span className="text-muted-foreground">Custo adicional:</span>
                        <p className="font-semibold text-destructive">R$ {parseFloat(newSale.additionalCost).toFixed(2)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Lucro:</span>
                      <p className="font-semibold text-success">R$ {(parseFloat(newSale.saleValue) - (parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile) - parseFloat(newSale.additionalCost || "0")).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem:</span>
                      <p className="font-semibold">{(((parseFloat(newSale.saleValue) - (parseFloat(newSale.milesUsed) * selectedProgramStock.averageCostPerMile) - parseFloat(newSale.additionalCost || "0")) / parseFloat(newSale.saleValue)) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Passageiros no Bilhete</Label>
                  <Button type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={addPassenger}>
                    Adicionar
                  </Button>
                </div>
                {newSale.passengers.map((passenger, index) => (
                  <div key={index} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2">
                    <Select
                      value={passenger.clientId ?? ""}
                      onValueChange={(value) => {
                        if (value === "__manual__") {
                          const updatedPassengers = newSale.passengers.map((p, i) =>
                            i === index ? { ...p, clientId: undefined, name: "", cpf: "" } : p
                          );
                          setNewSale({ ...newSale, passengers: updatedPassengers });
                        } else {
                          const client = clients.find(c => c.id === value);
                          if (client) {
                            const updatedPassengers = newSale.passengers.map((p, i) =>
                              i === index ? {
                                ...p,
                                clientId: client.id,
                                name: client.name,
                                cpf: client.cpf ?? p.cpf
                              } : p
                            );
                            setNewSale({ ...newSale, passengers: updatedPassengers });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-24 text-xs">
                        <SelectValue placeholder="Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__manual__">— Manual —</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Nome completo"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="ID Passageiro"
                      value={passenger.passengerId}
                      disabled
                      className="bg-muted/30 text-muted-foreground text-xs"
                    />
                    <Input
                      placeholder="CPF"
                      value={passenger.cpf}
                      onChange={(e) => updatePassenger(index, 'cpf', e.target.value)}
                    />
                    {newSale.passengers.length > 1 && (
                      <Button type="button" size="sm" variant="outline" className="min-h-[44px] min-w-[44px]" onClick={() => removePassenger(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {programConfig?.maxPassengers && (() => {
                const newCount = newSale.passengers.filter(p => p.name.trim()).length;
                const totalAfter = usedPassengersInCycle + newCount;
                if (totalAfter > programConfig.maxPassengers) {
                  return (
                    <p className="text-xs text-destructive">
                      Limite de {programConfig.maxPassengers} passageiros excedido para este ciclo.
                      Usados: {usedPassengersInCycle} + {newCount} novo(s) = {totalAfter}
                    </p>
                  );
                }
                return null;
              })()}
             </div>
             
             <div className="flex justify-end gap-2 mt-4">
               <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                 Cancelar
               </Button>
               <Button 
                 onClick={handleCreateSale} 
                 className="bg-gradient-primary hover:opacity-90"
                 disabled={!newSale.ownerName || !newSale.accountId || !newSale.program || !newSale.clientId || !newSale.milesUsed || !newSale.saleValue || !selectedProgramStock || parseFloat(newSale.milesUsed) > selectedProgramStock.availableMiles || (programConfig?.maxPassengers && usedPassengersInCycle + newSale.passengers.filter(p => p.name.trim()).length > programConfig.maxPassengers)}
               >
                 Registrar Venda
               </Button>
             </div>
         </FormDrawer>

         <FormDrawer
           open={isClientDialogOpen}
           onOpenChange={(open) => { setIsClientDialogOpen(open); if (!open) setClientErrors({}); }}
           title="Novo Cliente"
         >
           <div className="grid gap-4 py-4">
             <div className="space-y-2">
               <Label>Nome Completo</Label>
               <Input
                 value={newClient.name}
                 onChange={(e) => { setNewClient({...newClient, name: e.target.value}); setClientErrors(p => ({...p, name: ""})); }}
                 placeholder="Digite o nome completo"
               />
               {clientErrors.name && <p className="text-xs text-destructive">{clientErrors.name}</p>}
             </div>

             <div className="space-y-2">
               <Label>CPF</Label>
               <Input
                 value={newClient.cpf}
                 onChange={(e) => {
                   const numbers = e.target.value.replace(/\D/g, "").slice(0, 11);
                   const formatted = formatCPF(numbers);
                   setNewClient({...newClient, cpf: formatted});
                 }}
                 placeholder="000.000.000-00"
                 maxLength={14}
               />
             </div>

             <div className="space-y-2">
               <Label>E-mail</Label>
               <Input
                 type="email"
                 value={newClient.email}
                 onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                 placeholder="cliente@email.com"
               />
             </div>

             <div className="space-y-2">
               <Label>Telefone</Label>
               <Input
                 value={newClient.phone}
                 onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                 placeholder="(11) 99999-9999"
               />
             </div>

             <div className="space-y-2">
               <Label>Contato Telegram</Label>
               <Input
                 value={newClient.telegram}
                 onChange={(e) => setNewClient({...newClient, telegram: e.target.value})}
                 placeholder="@usuario"
               />
             </div>
           </div>
           <div className="flex justify-end gap-2 mt-4">
             <Button variant="outline" onClick={() => { setIsClientDialogOpen(false); setClientErrors({}); }}>
               Cancelar
             </Button>
             <Button onClick={handleCreateClient} className="bg-gradient-primary hover:opacity-90">
               Cadastrar
             </Button>
           </div>
         </FormDrawer>


      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-appear animate-delay-300">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {totalProfit.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milhas Vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalMilesSold.toLocaleString('pt-BR')}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Margem Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{averageProfitMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="hidden md:table-cell">Dono/Programa</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Milhas</TableHead>
                  <TableHead className="hidden md:table-cell">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Lucro</TableHead>
                  <TableHead className="hidden md:table-cell">Margem</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className={sale.status === 'cancelado' ? 'opacity-50' : ''}>
                    <TableCell className="hidden md:table-cell">{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="font-medium">{sale.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{sale.program}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p className="font-medium">{sale.clientName}</p>
                        <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sale.milesUsed.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="hidden md:table-cell">R$ {sale.saleValue.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className={`hidden md:table-cell font-semibold ${sale.profit < 0 ? 'text-destructive' : 'text-success'}`}>
                      R$ {sale.profit.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{sale.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {sale.status === 'cancelado' ? (
                        <Badge variant="outline" className="text-destructive border-destructive">Cancelado</Badge>
                      ) : (
                        <Select 
                          value={sale.status} 
                          onValueChange={(value) => updateSaleStatus(sale.id, value as "pendente" | "pago" | "concluido")}
                        >
                          <SelectTrigger className="w-28">
                            <span className={`h-2 w-2 rounded-full ${sale.status === 'pendente' ? 'bg-warning' : sale.status === 'pago' ? 'bg-primary' : 'bg-success'}`} />
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
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{sale.passengers.length} pax</span>
                        {sale.status !== 'cancelado' && (
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
          <div className="md:hidden space-y-3 mt-4">
            {filteredSales.length === 0 && (
              <div className="py-8">
                <EmptyState icon={Package} title="Nenhuma venda encontrada" description={searchTerm || statusFilter !== "todos" ? "Tente alterar os filtros ou limpar a busca." : "Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer."} />
              </div>
            )}
            {filteredSales.map((sale) => (
              <div key={sale.id} className={`border rounded-lg p-4 space-y-3 ${sale.status === 'cancelado' ? 'opacity-50' : ''}`}>
                {/* Header: Program + Status */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{sale.program}</p>
                    <p className="text-xs text-muted-foreground truncate">{sale.ownerName} • {new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {sale.status === 'cancelado' ? (
                    <Badge variant="outline" className="text-destructive border-destructive shrink-0 ml-2">Cancelado</Badge>
                  ) : (
                    <Badge variant="outline" className={`shrink-0 ml-2 ${sale.status === 'pendente' ? 'text-warning border-warning' : sale.status === 'pago' ? 'text-primary border-primary' : 'text-success border-success'}`}>
                      {sale.status === 'pendente' ? 'Pendente' : sale.status === 'pago' ? 'Pago' : 'Concluído'}
                    </Badge>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Cliente:</span>
                    <p className="font-semibold truncate">{sale.clientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Milhas:</span>
                    <p className="font-semibold">{sale.milesUsed.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Valor:</span>
                    <p className="font-semibold">R$ {sale.saleValue.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Lucro:</span>
                    <p className={`font-semibold ${sale.profit < 0 ? 'text-destructive' : 'text-success'}`}>
                      R$ {sale.profit.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Locator + passengers */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {sale.ticketLocator && (
                      <span className="truncate">Localizador: {sale.ticketLocator}</span>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="h-3 w-3" />
                      {sale.passengers.length} pax
                    </span>
                  </div>
                </div>

                {/* Status + Actions */}
                {sale.status !== 'cancelado' && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]"
                      onClick={() => setCancelConfirmId(sale.id)}
                    >
                      Cancelar
                    </Button>
                    <div className="flex-1">
                      <Select 
                        value={sale.status} 
                        onValueChange={(value) => updateSaleStatus(sale.id, value as "pendente" | "pago" | "concluido")}
                      >
                        <SelectTrigger className="w-full min-h-[44px]">
                          <span className={`h-2 w-2 rounded-full ${sale.status === 'pendente' ? 'bg-warning' : sale.status === 'pago' ? 'bg-primary' : 'bg-success'}`} />
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

      <AlertDialog open={!!cancelConfirmId} onOpenChange={(open) => { if (!open) setCancelConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => {
              if (cancelConfirmId) {
                cancelSaleM.mutate(cancelConfirmId);
                setCancelConfirmId(null);
              }
            }}>
              Sim, cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Simulador de Venda */}
      <FormDrawer
        open={simulatorOpen}
        onOpenChange={(open) => {
          setSimulatorOpen(open);
          if (!open) setSimInputs({ accountId: "", miles: "", pricePerMile: "", costPerMile: "", additionalCost: "" });
        }}
        title="Simulador de Venda"
      >
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Calcule rapidamente o lucro e a margem de uma venda sem criar registro.
          </p>

          <div className="space-y-2">
            <Label>Conta (opcional — preenche custo automaticamente)</Label>
            <Select value={simInputs.accountId} onValueChange={handleSelectSimAccount}>
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
              <Input
                id="simMiles"
                type="number"
                value={simInputs.miles}
                onChange={(e) => setSimInputs({...simInputs, miles: e.target.value})}
                placeholder="Ex: 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="simPrice">Preço por Milha (R$)</Label>
              <Input
                id="simPrice"
                type="number"
                step="0.0001"
                value={simInputs.pricePerMile}
                onChange={(e) => setSimInputs({...simInputs, pricePerMile: e.target.value})}
                placeholder="Ex: 0.03"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="simCost">Custo por Milha (R$)</Label>
              <Input
                id="simCost"
                type="number"
                step="0.0001"
                value={simInputs.costPerMile}
                onChange={(e) => setSimInputs({...simInputs, costPerMile: e.target.value})}
                placeholder="Ex: 0.07"
              />
              {simInputs.accountId && (
                <p className="text-xs text-muted-foreground">Preenchido automaticamente da conta</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="simAddCost">Custo Adicional (R$)</Label>
              <Input
                id="simAddCost"
                type="number"
                step="0.01"
                value={simInputs.additionalCost}
                onChange={(e) => setSimInputs({...simInputs, additionalCost: e.target.value})}
                placeholder="Ex: 50.00"
              />
            </div>
          </div>

          {simResults.saleValue > 0 && (
            <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-3 animate-slide-up">
              <h4 className="font-semibold text-sm">Resultado da Simulação:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Valor da Venda:</span>
                  <p className="font-bold text-lg">R$ {simResults.saleValue.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Custo Total:</span>
                  <p className="font-semibold">R$ {simResults.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Lucro:</span>
                  <p className={`font-bold text-lg ${simResults.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {simResults.profit >= 0 ? '+' : ''}R$ {simResults.profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Margem:</span>
                  <p className={`font-bold text-lg ${simResults.margin >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {simResults.margin.toFixed(1)}%
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">ROI:</span>
                  <p className={`font-bold text-lg ${simResults.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {simResults.roi.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {parseFloat(simInputs.miles) > 0 && simResults.saleValue === 0 && (
            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
              Preencha o preço por milha para ver os resultados
            </div>
          )}
        </div>
      </FormDrawer>
    </div>
  );
}