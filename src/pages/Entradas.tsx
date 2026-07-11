import { useState, useMemo } from "react";
import {
  Plus,
  ArrowLeftRight,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormDrawer } from "@/components/FormDrawer";
import { SkeletonPage } from "@/components/SkeletonLoader";
import { useHaptic } from "@/hooks/useHaptic";
import { useDebounce } from "@/hooks/useDebounce";
import { useData } from "@/contexts/DataContext";
import { isTransferencia } from "@/lib/utils";
import { calculateRecurrence } from "@/lib/recurrence";
import { calcMilesGenerated, calcCostPerThousand, calcCostPerMile } from "@/lib/metrics";
import { buildMonthlyRecurrence, serializeOrigemTypeDescription } from "@/lib/origemTypes";
import { toast } from "sonner";
import {
  useAddEntryMutation,
  useUpdateEntryMutation,
  useAddOrigemTypeMutation,
  useConfirmEntryMutation,
} from "@/hooks/useDatabase";
import { EntrySummary } from "@/components/EntrySummary";
import { EntryTable } from "@/components/EntryTable";
import { EntryForm } from "@/components/EntryForm";
import type { EntryFormData } from "@/components/EntryForm";
import confetti from "canvas-confetti";
import type { PointEntry } from "@/types";

export default function Entradas() {
  const { entries, accounts, owners, programs, origemTypes, isLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const addEntryM = useAddEntryMutation();
  const updateEntryM = useUpdateEntryMutation();
  const addOrigemTypeM = useAddOrigemTypeMutation();
  const confirmEntryM = useConfirmEntryMutation();
  const haptic = useHaptic();

  const [activeTab, setActiveTab] = useState<"pontos" | "milhas">("pontos");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PointEntry | null>(null);
  const [transferInitialData, setTransferInitialData] = useState<
    Partial<EntryFormData> | undefined
  >(undefined);

  const handleOpenTransfer = () => {
    const transferId = origemTypes.find((ot) => isTransferencia(ot))?.id ?? "";
    setActiveTab("milhas");
    setTransferInitialData({ origemTypeId: transferId });
    setIsCreateDialogOpen(true);
  };

  const computeFromForm = (form: EntryFormData) => {
    const ot = origemTypes.find((ot) => ot.id === form.origemTypeId);
    const isTransfer = ot ? isTransferencia(ot) : false;
    const amount = parseFloat(form.amount);
    const cartAmount = parseFloat(form.cartAmount || "0");
    const amountPaid = parseFloat(form.amountPaid);
    const cartCost = parseFloat(form.cartCost || "0");
    const conversionRate = parseFloat(form.conversionRate || "1");
    const bonusPercent = isTransfer ? parseFloat(form.bonusPercent || "0") : undefined;
    const totalAmount = amount + (isTransfer ? cartAmount : 0);
    const totalPaid = amountPaid + cartCost;
    const milesGenerated = calcMilesGenerated(totalAmount, conversionRate, bonusPercent);
    const costPerThousand = calcCostPerThousand(totalPaid, milesGenerated);
    const costPerMile = calcCostPerMile(totalPaid, milesGenerated);
    return {
      isTransfer,
      amount,
      cartAmount,
      amountPaid,
      cartCost,
      conversionRate,
      bonusPercent,
      totalAmount,
      totalPaid,
      milesGenerated,
      costPerThousand,
      costPerMile,
    };
  };

  const handleCreateEntry = (form: EntryFormData) => {
    const c = computeFromForm(form);
    const isSplit = form.isRecurrent && form.recurrenceValueMode === 'split' && form.recurrenceCount > 1;
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
        milesGenerated: c.milesGenerated,
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
    setIsCreateDialogOpen(false);
  };

  const handleUpdateEntry = (form: EntryFormData) => {
    if (!editingEntry) return;
    const c = computeFromForm(form);
    
    // Determine recurrence settings
    let recurrenceInterval: number | undefined;
    let recurrenceEnd: string | undefined;
    if (form.isRecurrent && form.recurrenceCount > 1) {
      const type = form.recurrenceType as 'monthly' | 'quarterly' | 'semiannual' | 'annual';
      const intervalMap = { monthly: 30, quarterly: 90, semiannual: 180, annual: 365 };
      const interval = intervalMap[type];
      recurrenceInterval = interval;
      const startDate = new Date(form.date);
      const endDate = new Date(startDate.getTime() + interval * 24 * 60 * 60 * 1000 * form.recurrenceCount);
      recurrenceEnd = endDate.toISOString().split('T')[0];
    } else {
      // Fallback to existing clube recurrence (for backward compatibility)
      const clubeRec = buildMonthlyRecurrence(form.isClube, form.clubeMeses);
      recurrenceInterval = clubeRec.recurrenceInterval;
      recurrenceEnd = clubeRec.recurrenceEnd;
    }
    
    const recurrenceFields: Record<string, number | string | undefined> = {};
    if (recurrenceInterval !== undefined) recurrenceFields.recurrenceInterval = recurrenceInterval;
    if (recurrenceEnd !== undefined) recurrenceFields.recurrenceEnd = recurrenceEnd;
    
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

  const entriesByTab = useMemo(
    () => entries.filter((e) => accounts.find((a) => a.id === e.accountId)?.type === activeTab),
    [entries, accounts, activeTab],
  );

  const entriesFiltered = useMemo(() => {
    if (!debouncedSearch) return entriesByTab;
    const q = debouncedSearch.toLowerCase();
    return entriesByTab.filter((e) => {
      const account = accounts.find((a) => a.id === e.accountId);
      const accountName = account?.name.toLowerCase() ?? "";
      const origemNome =
        origemTypes.find((ot) => ot.id === e.origemTypeId)?.name.toLowerCase() ??
        programs.find((p) => p.id === e.origemTypeId)?.name.toLowerCase() ??
        "";
      return (
        accountName.includes(q) ||
        origemNome.includes(q) ||
        new Date(e.date).toLocaleDateString("pt-BR").includes(q)
      );
    });
  }, [entriesByTab, debouncedSearch, accounts, origemTypes, programs]);

  const confirmedEntries = useMemo(
    () => entriesFiltered.filter((e) => e.entryStatus !== "aguardando"),
    [entriesFiltered],
  );
  const pendingEntries = useMemo(
    () => entriesByTab.filter((e) => e.entryStatus === "aguardando"),
    [entriesByTab],
  );
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
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 w-full"
              placeholder="Buscar entrada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleOpenTransfer}
            className="gap-2 bg-gradient-primary hover:opacity-90 shrink-0"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Transferir
          </Button>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => {
              setTransferInitialData(undefined);
              setIsCreateDialogOpen(true);
            }}
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
                  setEditingEntry(entry);
                  setIsEditDialogOpen(true);
                }}
                onConfirm={(entry) => confirmEntryM.mutate(entry)}
                onCreateClick={() => {
                  setTransferInitialData(undefined);
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
                  setTransferInitialData(undefined);
                  setIsCreateDialogOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <FormDrawer
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTransferInitialData(undefined);
            setIsCreateDialogOpen(false);
          }
          setIsCreateDialogOpen(open);
        }}
        title={`Registrar Nova Entrada - ${activeTab === "pontos" ? "Pontos" : "Milhas"}`}
      >
        <EntryForm
          mode="create"
          initialData={transferInitialData}
          accounts={accounts}
          origemTypes={origemTypes}
          programs={programs}
          owners={owners}
          activeTab={activeTab}
          onCreateOrigemType={handleCreateOrigemType}
          onSubmit={handleCreateEntry}
          onCancel={() => {
            setTransferInitialData(undefined);
            setIsCreateDialogOpen(false);
          }}
        />
      </FormDrawer>

      {/* Edit Dialog */}
      <FormDrawer
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEntry(null);
          }
          setIsEditDialogOpen(open);
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
              conversionRate: editingEntry.conversionRate
                ? String(editingEntry.conversionRate)
                : "",
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
            activeTab={activeTab}
            onSubmit={handleUpdateEntry}
            onCancel={() => {
              setEditingEntry(null);
              setIsEditDialogOpen(false);
            }}
          />
        )}
      </FormDrawer>
    </div>
  );
}
