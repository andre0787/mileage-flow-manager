import { useState, useMemo } from "react";
import { Plus, Search, Calculator, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonMetricCard, SkeletonTable } from "@/components/SkeletonLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { useHaptic } from "@/hooks/useHaptic";
import { useData } from "@/contexts/DataContext";
import {
  useAddSaleMutation,
  useUpdateSaleMutation,
  useCancelSaleMutation,
  useAddClientMutation,
} from "@/hooks/useDatabase";
import { calcProfit, calcProfitMargin } from "@/lib/metrics";
import { downloadCSV } from "@/lib/utils";
import { SaleMetrics } from "@/components/SaleMetrics";
import { SaleForm, type SaleFormData } from "@/components/SaleForm";
import { SaleTable } from "@/components/SaleTable";
import { SaleSimulator, type StockItem } from "@/components/SaleSimulator";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import type { Sale } from "@/types";

export default function Vendas() {
  const { clients, accounts, owners, programs, sales, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const addSaleM = useAddSaleMutation();
  const updateSaleM = useUpdateSaleMutation();
  const cancelSaleM = useCancelSaleMutation();
  const addClientM = useAddClientMutation();
  const haptic = useHaptic();

  // Stock info compartilhado com o Simulador
  const stockInfo: StockItem[] = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "milhas" && a.status === "ativa")
        .map((a) => ({
          accountId: a.id,
          ownerName: owners.find((o) => o.id === a.ownerId)?.name ?? "",
          accountName: a.name,
          averageCostPerMile: a.averageCostPerMile ?? 0,
        })),
    [accounts, owners],
  );

  // Handlers
  const handleCreateSale = (data: SaleFormData) => {
    const milesUsed = parseFloat(data.milesUsed);
    const saleValue = parseFloat(data.saleValue);
    const additionalCost = parseFloat(data.additionalCost || "0");
    // costPerMille vem preenchido pelo SaleForm a partir do estoque selecionado
    const costPerMile = data.costPerMile ?? 0;
    const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
    const profitMargin = calcProfitMargin(profit, saleValue);

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
        passengers: data.passengers.filter((p) => p.name.trim()),
        date: new Date().toISOString().split("T")[0],
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
        onError: () => toast.error("Erro ao criar venda. Verifique os dados e tente novamente."),
      },
    );
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSale = (data: SaleFormData) => {
    if (!editingSale) return;
    const milesUsed = parseFloat(data.milesUsed);
    const saleValue = parseFloat(data.saleValue);
    const additionalCost = parseFloat(data.additionalCost || "0");
    const costPerMile = data.costPerMile ?? 0;
    const profit = calcProfit(saleValue, milesUsed, costPerMile, additionalCost);
    const profitMargin = calcProfitMargin(profit, saleValue);

    updateSaleM.mutate(
      {
        id: editingSale.id,
        accountId: data.accountId,
        accountName: data.accountName,
        ownerName: data.ownerName,
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
        ticketLocator: data.ticketLocator,
        passengers: data.passengers.filter((p) => p.name.trim()),
        date: editingSale.date,
      },
      {
        onSuccess: () => haptic.success(),
        onError: () =>
          toast.error("Erro ao atualizar venda. Verifique os dados e tente novamente."),
      },
    );
    setEditingSale(null);
    setIsEditDialogOpen(false);
  };

  const handleCancelSale = (saleId: string) => {
    cancelSaleM.mutate(saleId);
  };

  const handleStatusChange = (saleId: string, status: "pendente" | "pago" | "concluido") => {
    updateSaleM.mutate({ id: saleId, status });
  };

  const handleCreateClient = async (data: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    phone: string;
    telegram: string;
  }) => {
    await addClientM.mutateAsync({
      id: data.id,
      name: data.name.trim(),
      cpf: data.cpf,
      email: data.email.trim(),
      phone: data.phone,
      telegram: data.telegram,
      totalPurchases: 0,
      usageHistory: [],
    });
  };

  const exportSalesReport = () => {
    const data = filteredSales.map((s) => ({
      Data: new Date(s.date).toLocaleDateString("pt-BR"),
      Cliente: s.clientName,
      Dono: s.ownerName,
      Programa: s.program,
      "Milhas": s.milesUsed,
      "Valor Venda (R$)": s.saleValue,
      "Custo/Milha (R$)": s.costPerMile?.toFixed(4) ?? "",
      "Lucro (R$)": s.profit?.toFixed(2) ?? "",
      "Margem": s.profitMargin ? `${(s.profitMargin * 100).toFixed(1)}%` : "",
      Status: s.status,
    }));
    downloadCSV(data, `vendas-${new Date().toISOString().split("T")[0]}.csv`);
    toast.success(`vendas-${new Date().toISOString().split("T")[0]}.csv baixado com sucesso`);
  };

  // Filtros
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
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
            <Button
              variant="outline"
              className="flex-1 sm:flex-none gap-2"
              onClick={exportSalesReport}
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none gap-2"
              onClick={() => setSimulatorOpen(true)}
            >
              <Calculator className="h-4 w-4" />
              Simular
            </Button>
            <Button
              className="flex-1 sm:flex-none gap-2 bg-gradient-primary hover:opacity-90"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Nova Venda
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
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onEdit={(sale) => {
          setEditingSale(sale);
          setIsEditDialogOpen(true);
        }}
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

      {/* Formulário de edição */}
      <SaleForm
        key={editingSale?.id ?? 'edit'}
        mode="edit"
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingSale(null);
          setIsEditDialogOpen(open);
        }}
        accounts={accounts}
        owners={owners}
        programs={programs}
        clients={clients}
        sales={sales}
        onSubmit={handleUpdateSale}
        onCreateClient={handleCreateClient}
        initialData={
          editingSale
            ? {
                ownerName: editingSale.ownerName,
                accountId: editingSale.accountId ?? "",
                accountName: editingSale.accountName,
                program: editingSale.program,
                clientId: editingSale.clientId,
                clientName: editingSale.clientName,
                milesUsed: editingSale.milesUsed.toString(),
                pricePerMile: editingSale.pricePerMile?.toString() ?? "",
                saleValue: editingSale.saleValue.toString(),
                additionalCost: editingSale.additionalCost?.toString() ?? "",
                additionalCostDesc: editingSale.additionalCostDesc ?? "",
                ticketLocator: editingSale.ticketLocator,
                passengers: editingSale.passengers,
                costPerMile: editingSale.costPerMile,
              }
            : undefined
        }
      />

      {/* Simulador */}
      <SaleSimulator open={simulatorOpen} onOpenChange={setSimulatorOpen} stockInfo={stockInfo} />
    </div>
  );
}
