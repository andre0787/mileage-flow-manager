import { useState, useMemo } from "react";
import {
  Plus,
  ArrowLeftRight,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { OwnerFilter, ALL_OWNERS } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDrawer } from "@/components/FormDrawer";
import { SkeletonPage } from "@/components/SkeletonLoader";
import { BalanceReconcileBanner } from "@/components/BalanceReconcileBanner";
import { useHaptic } from "@/hooks/useHaptic";
import { useDebounce } from "@/hooks/useDebounce";
import { useData } from "@/contexts/DataContext";
import { isTransferencia } from "@/lib/utils";
import { calculateRecurrence } from "@/lib/recurrence";
import { computeEntryValues } from "@/lib/entryOperations";
import { serializeOrigemTypeDescription } from "@/lib/origemTypes";
import { formatDateBR } from "@/lib/dateUtils";
import { toast } from "sonner";
import {
  useAddEntryMutation,
  useUpdateEntryMutation,
  useAddOrigemTypeMutation,
  useAddAccountMutation,
  useConfirmEntryMutation,
  useAddOwnerMutation,
  useAddProgramMutation,
} from "@/hooks/useDatabase";
import { EntrySummary } from "@/components/EntrySummary";
import { EntryTable } from "@/components/EntryTable";
import { TransferForm } from "@/components/TransferForm";
import { EntryForm } from "@/components/EntryForm";
import type { EntryFormData } from "@/types";
import confetti from "canvas-confetti";
import type { PointEntry } from "@/types";

export default function Entradas() {
  const { entries, accounts, owners, programs, origemTypes, sales, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const addEntryM = useAddEntryMutation();
  const updateEntryM = useUpdateEntryMutation();
  const addOrigemTypeM = useAddOrigemTypeMutation();
  const addAccountM = useAddAccountMutation();
  const addOwnerM = useAddOwnerMutation();
  const addProgramM = useAddProgramMutation();
  const confirmEntryM = useConfirmEntryMutation();
  const haptic = useHaptic();

  const [activeTab, setActiveTab] = useState<"pontos" | "milhas">("pontos");
  const [ownerFilter, setOwnerFilter] = useState<string>(ALL_OWNERS);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PointEntry | null>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const handleCreateEntry = (form: EntryFormData) => {
    const c = computeEntryValues(form, origemTypes);
    const isSplit =
      form.isRecurrent && form.recurrenceValueMode === "split" && form.recurrenceCount > 1;
    const divisor = isSplit ? form.recurrenceCount : 1;
    addEntryM.mutate(
      {
        id: crypto.randomUUID(),
        accountId: form.accountId,
        origemTypeId: form.origemTypeId,
        amount: c.amount / divisor,
        amountPaid: c.totalPaid / divisor,
        costPerThousand: c.costPerThousand,
        conversionRate: c.isTransfer
          ? 1 + parseFloat(form.bonusPercent || "0") / 100
          : activeTab === "milhas"
            ? undefined
            : c.conversionRate,
        // ponytail: no split, amount/amountPaid são divididos — milesGenerated
        // também precisa ser dividido para o saldo da conta não inflar (bug #356)
        milesGenerated: c.milesGenerated / divisor,
        costPerMile: c.costPerMile,
        sourceAccountId: c.isTransfer ? form.sourceAccountId : undefined,
        bonusPercent: c.isTransfer ? parseFloat(form.bonusPercent || "0") : undefined,
        cartAmount: c.isTransfer && c.cartAmount > 0 ? c.cartAmount : undefined,
        cartCost: c.isTransfer && c.cartCost > 0 ? c.cartCost : undefined,
        ...calculateRecurrence({
          isRecurrent: form.isRecurrent,
          recurrenceCount: form.recurrenceCount,
          recurrenceType: form.recurrenceType,
          date: form.date,
          isClube: form.isClube,
          clubeMeses: form.clubeMeses,
          recurrenceValueMode: form.recurrenceValueMode,
        }),
        date: form.date,
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
        onError: () => toast.error("Erro ao salvar entrada. Verifique os dados e tente novamente."),
      },
    );
    // Fecha o dialog de origem do submit: TransferForm usa o mesmo handler (isTransferDialogOpen)
    setIsCreateDialogOpen(false);
    setIsTransferDialogOpen(false);
  };

  const handleUpdateEntry = (form: EntryFormData) => {
    if (!editingEntry) return;
    const c = computeEntryValues(form, origemTypes);

    // Determine recurrence settings
    let recurrenceFields: Record<string, unknown> = {};
    if (form.isRecurrent && form.recurrenceCount > 1) {
      recurrenceFields = {
        ...calculateRecurrence({
          isRecurrent: form.isRecurrent,
          recurrenceCount: form.recurrenceCount,
          recurrenceType: form.recurrenceType,
          date: form.date,
          isClube: form.isClube,
          clubeMeses: form.clubeMeses,
          recurrenceValueMode: form.recurrenceValueMode,
        }),
      };
    } else if (editingEntry?.recurrenceInterval) {
      // Preserve existing recurrence from clube entries (backward compat)
      recurrenceFields = {
        recurrenceInterval: editingEntry.recurrenceInterval,
        recurrenceEnd: editingEntry.recurrenceEnd,
      };
    }

    const ot = origemTypes.find((ot) => ot.id === form.origemTypeId);
    const isTransfer = ot ? isTransferencia(ot) : false;

    updateEntryM.mutate({
      oldEntry: editingEntry,
      updates: {
        accountId: form.accountId,
        origemTypeId: form.origemTypeId,
        amount: c.amount,
        amountPaid: c.totalPaid,
        costPerThousand: c.costPerThousand,
        conversionRate: c.isTransfer
          ? 1 + parseFloat(form.bonusPercent || "0") / 100
          : activeTab === "milhas"
            ? undefined
            : c.conversionRate,
        milesGenerated: c.milesGenerated,
        costPerMile: c.costPerMile,
        sourceAccountId: c.isTransfer ? form.sourceAccountId : undefined,
        bonusPercent: c.isTransfer ? parseFloat(form.bonusPercent || "0") : undefined,
        cartAmount: c.isTransfer && c.cartAmount > 0 ? c.cartAmount : undefined,
        cartCost: c.isTransfer && c.cartCost > 0 ? c.cartCost : undefined,
        date: form.date,
        ...recurrenceFields,
      },
    });
    setEditingEntry(null);
    setIsEditDialogOpen(false);
  };

  const handleCreateOwner = async (data: { name: string; cpf?: string; phone?: string }) => {
    const id = crypto.randomUUID();
    await addOwnerM.mutateAsync({
      id,
      name: data.name,
      cpf: data.cpf ?? "",
      phone: data.phone ?? "",
    });
    return id;
  };

  const handleCreateProgram = async (data: { name: string; type: "pontos" | "milhas" }) => {
    const id = crypto.randomUUID();
    await addProgramM.mutateAsync({ id, name: data.name, type: data.type });
    return id;
  };

  const handleCreateOrigemType = async (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
  }) => {
    const id = crypto.randomUUID();
    const desc = serializeOrigemTypeDescription(data.hasRecurrence);
    await addOrigemTypeM.mutateAsync({
      id,
      name: data.name,
      accountType: activeTab,
      color: data.color,
      description: desc,
    });
    return id;
  };

  const handleCreateAccount = async (data: {
    name: string;
    ownerId: string;
    programId: string;
  }) => {
    const program = programs.find((p) => p.id === data.programId);
    if (!program) return;
    const id = crypto.randomUUID();
    await addAccountM.mutateAsync({
      id,
      name: data.name,
      ownerId: data.ownerId,
      programId: data.programId,
      type: program.type,
      balance: 0,
      status: "ativa",
      createdAt: new Date().toISOString().split("T")[0],
    });
    return id;
  };

  const entriesByTab = useMemo(
    () => entries.filter((e) => accounts.find((a) => a.id === e.accountId)?.type === activeTab),
    [entries, accounts, activeTab],
  );

  const entriesFiltered = useMemo(() => {
    const ownerAccountIds =
      ownerFilter === ALL_OWNERS
        ? null
        : new Set(accounts.filter((a) => a.ownerId === ownerFilter).map((a) => a.id));
    const byOwner = ownerAccountIds
      ? entriesByTab.filter((e) => ownerAccountIds.has(e.accountId))
      : entriesByTab;
    if (!debouncedSearch) return byOwner;
    const q = debouncedSearch.toLowerCase();
    return byOwner.filter((e) => {
      const account = accounts.find((a) => a.id === e.accountId);
      const accountName = account?.name.toLowerCase() ?? "";
      const origemNome =
        origemTypes.find((ot) => ot.id === e.origemTypeId)?.name.toLowerCase() ??
        programs.find((p) => p.id === e.origemTypeId)?.name.toLowerCase() ??
        "";
      return accountName.includes(q) || origemNome.includes(q) || formatDateBR(e.date).includes(q);
    });
  }, [entriesByTab, debouncedSearch, accounts, origemTypes, programs, ownerFilter]);

  const confirmedEntries = useMemo(
    () => entriesFiltered.filter((e) => e.entryStatus !== "aguardando"),
    [entriesFiltered],
  );
  const today = new Date().toISOString().split("T")[0];
  const overdueEntries = useMemo(
    () => entriesByTab.filter((e) => e.entryStatus === "aguardando" && e.date < today),
    [entriesByTab, today],
  );
  // ponytail: saldo calculado para o banner de reconciliação.
  // Fonte da verdade = entradas confirmadas - transferências de saída - vendas
  // (mesma semântica do computeDashboardMetrics e do recalcAccount).
  // Transferências têm accountId = destino (milhas): na aba pontos elas não
  // aparecem como crédito, mas DEBITAM a conta de pontos de origem — e vendas
  // debitam o saldo da conta sem contrapartida em entries.
  const tabAccounts = accounts.filter((a) => a.type === activeTab);
  const tabAccountIds = new Set(tabAccounts.map((a) => a.id));
  const tabSalesOut = sales
    .filter((s) => s.status !== "cancelado" && s.accountId && tabAccountIds.has(s.accountId))
    .reduce((s, sl) => s + sl.milesUsed, 0);
  const tabTransfersOut = entries
    .filter(
      (e) =>
        e.entryStatus !== "aguardando" && e.sourceAccountId && tabAccountIds.has(e.sourceAccountId),
    )
    .reduce((s, e) => s + e.amount, 0);
  // Usa TODAS as entradas da aba (entriesByTab), não o conjunto filtrado por
  // busca/dono — o banner não pode mudar ao digitar no SearchInput.
  const tabEntriesIn = entriesByTab
    .filter((e) => e.entryStatus !== "aguardando")
    .reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);
  const entriesTotalBalance = tabEntriesIn - tabTransfersOut - tabSalesOut;
  const accountsTotalBalance = tabAccounts.reduce((s, a) => s + a.balance, 0);
  const totalAmount = confirmedEntries.reduce((s, e) => s + e.amount, 0);
  const totalAmountPaid = confirmedEntries.reduce((s, e) => s + e.amountPaid, 0);
  const totalMilesGenerated = confirmedEntries.reduce(
    (s, e) => s + (e.milesGenerated ?? e.amount),
    0,
  );
  const averageCostPerMile = totalMilesGenerated > 0 ? totalAmountPaid / totalMilesGenerated : 0;

  if (isLoading) return <SkeletonPage />;

  return (
    <div className="space-y-6 animate-appear">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Entradas</h1>
          <p className="text-sm text-muted-foreground">Gerencie aquisição de pontos e milhas</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="flex-1 sm:flex-none min-w-[200px]">
            <SearchInput
              placeholder="Buscar entrada..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <OwnerFilter
            owners={owners}
            value={ownerFilter}
            onChange={setOwnerFilter}
            className="w-full sm:w-44"
          />
          <Button
            onClick={() => setIsTransferDialogOpen(true)}
            className="gap-2 bg-gradient-primary hover:opacity-90 shrink-0"
          >
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

      {/* Banners */}
      <div className="space-y-3">
        <BalanceReconcileBanner
          computedTotal={entriesTotalBalance}
          accounts={accounts.filter((a) => a.type === activeTab)}
        />
        {overdueEntries.length > 0 && (
          <div className="rounded-lg border border-red-400/30 bg-red-50 dark:bg-red-950/20 p-3 sm:p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {overdueEntries.length} entrada(s) atrasada(s) — confirmação vencida
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                Estas entradas já passaram da data e seguem sem confirmação. Confirme abaixo para
                atualizar o saldo da conta.
              </p>
            </div>
          </div>
        )}
      </div>

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
                  setEditingEntry(entry);
                  setIsEditDialogOpen(true);
                }}
                onConfirm={(entry) => confirmEntryM.mutate(entry)}
                onCreateClick={() => {
                  setIsCreateDialogOpen(true);
                }}
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
                  setEditingEntry(entry);
                  setIsEditDialogOpen(true);
                }}
                onConfirm={(entry) => confirmEntryM.mutate(entry)}
                onCreateClick={() => {
                  setIsCreateDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog — Pontos/Milhas */}
      <FormDrawer
        open={isCreateDialogOpen}
        onOpenChange={(open) => setIsCreateDialogOpen(open)}
        title={`Registrar Nova Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
      >
        <EntryForm
          type={activeTab === "pontos" ? "pontos" : "milhas"}
          mode="create"
          accounts={accounts}
          origemTypes={origemTypes}
          programs={programs}
          owners={owners}
          onCreateOrigemType={handleCreateOrigemType}
          onCreateAccount={handleCreateAccount}
          onCreateOwner={handleCreateOwner}
          onCreateProgram={handleCreateProgram}
          onSubmit={handleCreateEntry}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </FormDrawer>

      {/* Transfer Dialog */}
      <FormDrawer
        open={isTransferDialogOpen}
        onOpenChange={(open) => setIsTransferDialogOpen(open)}
        title="Registrar Transferência"
      >
        <TransferForm
          mode="create"
          accounts={accounts}
          origemTypes={origemTypes}
          programs={programs}
          owners={owners}
          onSubmit={handleCreateEntry}
          onCancel={() => setIsTransferDialogOpen(false)}
        />
      </FormDrawer>

      {/* Edit Dialog */}
      <FormDrawer
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
          setIsEditDialogOpen(open);
        }}
        title={`Editar Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
      >
        {editingEntry && editingEntry.sourceAccountId ? (
          <TransferForm
            mode="edit"
            initialData={{
              accountId: editingEntry.accountId,
              origemTypeId: editingEntry.origemTypeId,
              sourceAccountId: editingEntry.sourceAccountId ?? "",
              amount: String(editingEntry.amount),
              // amount_paid no banco já inclui o cartCost (salvo como totalPaid no create).
              // O form trata amountPaid como custo SÓ da transferência e o computeFromForm
              // soma cartCost de novo — então subtraímos aqui para evitar contagem dupla.
              amountPaid: String(
                Math.max(0, (editingEntry.amountPaid ?? 0) - (editingEntry.cartCost ?? 0)),
              ),
              bonusPercent: editingEntry.bonusPercent ? String(editingEntry.bonusPercent) : "",
              cartAmount: editingEntry.cartAmount ? String(editingEntry.cartAmount) : "",
              cartCost: editingEntry.cartCost ? String(editingEntry.cartCost) : "",
              date: editingEntry.date,
            }}
            accounts={accounts}
            origemTypes={origemTypes}
            programs={programs}
            owners={owners}
            onSubmit={handleUpdateEntry}
            onCancel={() => {
              setEditingEntry(null);
              setIsEditDialogOpen(false);
            }}
          />
        ) : editingEntry ? (
          <EntryForm
            type={activeTab === "pontos" ? "pontos" : "milhas"}
            mode="edit"
            initialData={{
              accountId: editingEntry.accountId,
              origemTypeId: editingEntry.origemTypeId,
              amount: String(editingEntry.amount),
              amountPaid: String(editingEntry.amountPaid),
              conversionRate: editingEntry.conversionRate
                ? String(editingEntry.conversionRate)
                : "",
              isClube: !!(editingEntry.recurrenceInterval && editingEntry.recurrenceEnd),
              clubeMeses: editingEntry.recurrenceEnd
                ? String(
                    Math.ceil(
                      (new Date(editingEntry.recurrenceEnd).getTime() -
                        new Date(editingEntry.date).getTime()) /
                        (30 * 24 * 60 * 60 * 1000),
                    ),
                  )
                : "",
              date: editingEntry.date,
            }}
            accounts={accounts}
            origemTypes={origemTypes}
            programs={programs}
            owners={owners}
            onSubmit={handleUpdateEntry}
            onCancel={() => {
              setEditingEntry(null);
              setIsEditDialogOpen(false);
            }}
          />
        ) : null}
      </FormDrawer>
    </div>
  );
}
