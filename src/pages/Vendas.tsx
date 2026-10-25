import { useState, useMemo, useCallback } from "react";
import { ALL_OWNERS, ALL_PROGRAMS } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useHaptic } from "@/hooks/useHaptic";
import { useData } from "@/contexts/DataContext";
import {
  useAddSaleMutation,
  useUpdateSaleMutation,
  useCancelSaleMutation,
  useAddClientMutation,
} from "@/hooks/useDatabase";
import {
  useReceiveWithCreditMutation,
  useRefundToCreditMutation,
  VendasHeader,
  VendasSkeleton,
  useVendasActions,
  mapSaleToInitialFormData,
  filterSales,
  buildExportRows,
  computeStockInfo,
} from "@/features/vendas";
import { downloadCSV } from "@/lib/utils";
import { SaleMetrics } from "@/components/SaleMetrics";
import { SaleForm } from "@/components/SaleForm";
import { SaleTable } from "@/components/SaleTable";
import { SaleSimulator, type StockItem } from "@/components/SaleSimulator";
import { toast } from "sonner";
import type { Sale } from "@/types";

export default function Vendas() {
  const { clients, accounts, owners, programs, sales, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [ownerFilter, setOwnerFilter] = useState<string>(ALL_OWNERS);
  const [programFilter, setProgramFilter] = useState<string>(ALL_PROGRAMS);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const addSaleM = useAddSaleMutation();
  const updateSaleM = useUpdateSaleMutation();
  const cancelSaleM = useCancelSaleMutation();
  const addClientM = useAddClientMutation();
  const receiveWithCreditM = useReceiveWithCreditMutation();
  const refundToCreditM = useRefundToCreditMutation();
  const haptic = useHaptic();

  const stockInfo: StockItem[] = useMemo(
    () => computeStockInfo(accounts, owners),
    [accounts, owners],
  );

  const { handleCreateSale, handleUpdateSale, handleReceiveWithCredit, handleRefundToCredit } =
    useVendasActions({
      editingSale,
      sales,
      addSaleM,
      updateSaleM,
      receiveWithCreditM,
      refundToCreditM,
      haptic,
      setIsCreateDialogOpen,
      setIsEditDialogOpen,
      setEditingSale,
    });

  const handleCreateClient = useCallback(
    async (d: {
      id: string;
      name: string;
      cpf: string;
      email: string;
      phone: string;
      telegram: string;
    }) => {
      await addClientM.mutateAsync({
        ...d,
        name: d.name.trim(),
        email: d.email.trim(),
        totalPurchases: 0,
        usageHistory: [],
      });
    },
    [addClientM],
  );

  const filteredSales = useMemo(
    () =>
      filterSales(
        sales,
        statusFilter,
        ownerFilter,
        programFilter,
        debouncedSearch,
        accounts,
        programs,
      ),
    [sales, statusFilter, ownerFilter, programFilter, programs, accounts, debouncedSearch],
  );

  const exportSalesReport = () => {
    downloadCSV(
      buildExportRows(filteredSales),
      `vendas-${new Date().toISOString().split("T")[0]}.csv`,
    );
    toast.success(`vendas-${new Date().toISOString().split("T")[0]}.csv baixado com sucesso`);
  };

  if (isLoading) return <VendasSkeleton />;

  return (
    <div className="space-y-6 animate-appear">
      <VendasHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        programFilter={programFilter}
        onProgramFilterChange={setProgramFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        owners={owners}
        programs={programs}
        onExport={exportSalesReport}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onNewSale={() => setIsCreateDialogOpen(true)}
      />
      <SaleMetrics sales={sales} />
      <SaleTable
        sales={filteredSales}
        ownerCustomColors={Object.fromEntries(owners.map((o) => [o.name, o.color ?? null]))}
        onCancel={(id) => cancelSaleM.mutate(id)}
        onStatusChange={(id, status) => updateSaleM.mutate({ id, status })}
        onReceive={handleReceiveWithCredit}
        onRefund={handleRefundToCredit}
        refundPending={refundToCreditM.isPending}
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onEdit={(sale) => {
          setEditingSale(sale);
          setIsEditDialogOpen(true);
        }}
      />
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
      <SaleForm
        key={editingSale?.id ?? "edit"}
        mode="edit"
        editingSaleId={editingSale?.id}
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
        initialData={mapSaleToInitialFormData(editingSale)}
      />
      <SaleSimulator open={simulatorOpen} onOpenChange={setSimulatorOpen} stockInfo={stockInfo} />
    </div>
  );
}
