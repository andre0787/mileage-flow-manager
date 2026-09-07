import { useEffect, useMemo, useState } from "react";
import { Plus, Filter, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerFilter, ALL_OWNERS } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { SkeletonMetricCard } from "@/components/SkeletonLoader";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountsTable } from "@/components/accounts/AccountsTable";
import { computeReceivablesByAccount } from "@/lib/accountReceivables";
import { sortByKey, type SortState } from "@/lib/sort";
import { avgUnitCost } from "@/lib/unitCost";
import { useData } from "@/contexts/DataContext";
import {
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useRecalcAccountMutation,
} from "@/hooks/useDatabase";
import AccountDialog from "@/components/AccountDialog";
import { AccountAlertsDialog } from "@/components/AccountAlertsDialog";
import { useAccountAlerts } from "@/hooks/useDatabase";
import { getLastAccountActivity } from "@/lib/accountActivity";
import type { Account, PointEntry, Sale } from "@/types";

const ITEMS_PER_PAGE = 20;

const FILTERS_KEY = "mc:contas:filters";
const SORT_KEY = "mc:contas:sort";

function readStored<T extends object>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // modo privado: filtros apenas não persistem
  }
}

export default function Contas() {
  const { accounts, owners, programs, entries, sales, isLoading } = useData();
  const updateAccountM = useUpdateAccountMutation();
  const deleteAccountM = useDeleteAccountMutation();
  const recalcAccountM = useRecalcAccountMutation();
  const [filterType, setFilterType] = useState<"todas" | "pontos" | "milhas">(() => {
    const stored = readStored(FILTERS_KEY, { filterType: "todas" }).filterType;
    return stored === "pontos" || stored === "milhas" ? stored : "todas";
  });
  const [ownerFilter, setOwnerFilter] = useState<string>(
    () => readStored(FILTERS_KEY, { ownerFilter: ALL_OWNERS }).ownerFilter,
  );
  const [sort, setSortState] = useState<SortState | null>(() => {
    try {
      const raw = localStorage.getItem(SORT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SortState;
      return parsed && typeof parsed.key === "string" ? parsed : null;
    } catch {
      return null;
    }
  });
  const setSort = (next: SortState) => {
    setSortState(next);
    setCurrentPage(1);
  };

  useEffect(() => {
    store(FILTERS_KEY, { filterType, ownerFilter });
  }, [filterType, ownerFilter]);
  useEffect(() => {
    try {
      if (sort) localStorage.setItem(SORT_KEY, JSON.stringify(sort));
      else localStorage.removeItem(SORT_KEY);
    } catch {
      // modo privado: sort apenas não persiste
    }
  }, [sort]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertsAccount, setAlertsAccount] = useState<Account | null>(null);

  const filteredAccounts = useMemo(() => {
    const byType =
      filterType === "todas" ? accounts : accounts.filter((a) => a.type === filterType);
    return ownerFilter === ALL_OWNERS ? byType : byType.filter((a) => a.ownerId === ownerFilter);
  }, [accounts, filterType, ownerFilter]);

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const ownerColor = (id: string) => owners.find((o) => o.id === id)?.color ?? null;
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;

  // Fonte da verdade: saldo calculado de entradas confirmadas - vendas ativas
  // ponytail: mesma lógica do dashboard, evita mostrar saldo corrompido
  const computedBalances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) {
      const accEntries = entries.filter(
        (e) => e.accountId === a.id && e.entryStatus !== "aguardando",
      );
      // Transferências debitam a conta origem (sourceAccountId) sem entrada própria
      // — o saldo calculado precisa descontá-las (mesma regra do recalcAccount).
      const accTransfersOut = entries.filter(
        (e) => e.sourceAccountId === a.id && e.entryStatus !== "aguardando",
      );
      const accSales = sales.filter((s) => s.accountId === a.id && s.status !== "cancelado");
      const entriesSum = accEntries.reduce((s, e) => s + (e.milesGenerated ?? e.amount), 0);
      const transfersOutSum = accTransfersOut.reduce((s, e) => s + e.amount, 0);
      const salesSum = accSales.reduce((s, sl) => s + sl.milesUsed, 0);
      map.set(a.id, Math.max(0, entriesSum - transfersOutSum - salesSum));
    }
    return map;
  }, [accounts, entries, sales]);

  // A receber por conta: vendas não-canceladas (mesmo padrão do computedBalances)
  const receivables = useMemo(() => computeReceivablesByAccount(sales), [sales]);

  // Última entrada e última venda válidas por conta (filtro idêntico ao computedBalances)
  const lastActivityByAccount = useMemo(() => {
    const map = new Map<string, { lastEntry?: PointEntry; lastSale?: Sale }>();
    for (const a of accounts) {
      map.set(a.id, getLastAccountActivity(entries, sales, a.id));
    }
    return map;
  }, [accounts, entries, sales]);

  const { data: allAlerts = [] } = useAccountAlerts();
  const unreadCount = (accountId: string) =>
    allAlerts.filter((a) => a.accountId === accountId && !a.read).length;

  // Ordenação (cópia — nunca muta o array memoizado). Todas as colunas de
  // dados são ordenáveis; conta sem média vai pro fim em ordem crescente.
  const sortedAccounts = useMemo(() => {
    if (!sort) return filteredAccounts;
    const getValue = (a: Account) =>
      sort.key === "saldo"
        ? (computedBalances.get(a.id) ?? a.balance)
        : sort.key === "investido"
          ? (a.totalInvested ?? 0)
          : sort.key === "receber"
            ? (receivables.get(a.id) ?? 0)
            : sort.key === "programa"
              ? programName(a.programId).toLowerCase()
              : sort.key === "dono"
                ? ownerName(a.ownerId).toLowerCase()
                : sort.key === "status"
                  ? a.status
                  : sort.key === "media"
                    ? (avgUnitCost(a.totalInvested, computedBalances.get(a.id) ?? a.balance) ?? Infinity)
                    : a.name;
    return sortByKey(filteredAccounts, sort.key, sort.dir, getValue);
  }, [filteredAccounts, sort, computedBalances, receivables, owners, programs]);

  const totalPages = Math.ceil(sortedAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = sortedAccounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Linhas da tabela (página atual, já enriquecidas)
  const tableRows = useMemo(
    () =>
      paginatedAccounts.map((account) => ({
        account,
        computedBalance: computedBalances.get(account.id) ?? account.balance,
        receivable: receivables.get(account.id) ?? 0,
        ownerName: ownerName(account.ownerId),
        ownerColorHex: ownerColor(account.ownerId),
        programName: programName(account.programId),
        unreadCount: unreadCount(account.id),
        lastEntryDate: lastActivityByAccount.get(account.id)?.lastEntry?.date,
        lastSaleDate: lastActivityByAccount.get(account.id)?.lastSale?.date,
        avgUnitCost: avgUnitCost(
          account.totalInvested,
          computedBalances.get(account.id) ?? account.balance,
        ),
      })),
    [
      paginatedAccounts,
      computedBalances,
      receivables,
      owners,
      programs,
      allAlerts,
      lastActivityByAccount,
    ],
  );

  // Totais do rodapé: lista filtrada inteira (não só a página)
  const footerTotals = useMemo(() => {
    let saldo = 0;
    let investido = 0;
    let receber = 0;
    for (const a of filteredAccounts) {
      saldo += computedBalances.get(a.id) ?? a.balance;
      investido += a.totalInvested ?? 0;
      receber += receivables.get(a.id) ?? 0;
    }
    // Média ponderada da lista: total investido ÷ saldo total
    const avgUnit = saldo > 0 && investido > 0 ? investido / saldo : null;
    return { count: filteredAccounts.length, saldo, investido, receber, avgUnit };
  }, [filteredAccounts, computedBalances, receivables]);

  // Faixa-resumo: mesmos valores do antigo AccountsSummary (todas as contas)
  const summaryStrip = useMemo(() => {
    const active = accounts.filter((a) => a.status === "ativa").length;
    let pontos = 0;
    let milhas = 0;
    for (const a of accounts) {
      const bal = computedBalances.get(a.id) ?? a.balance;
      if (a.type === "pontos") pontos += bal;
      else milhas += bal;
    }
    return { active, total: accounts.length, pontos, milhas };
  }, [accounts, computedBalances]);

  const toggleAccountStatus = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      updateAccountM.mutate({ id, status: account.status === "ativa" ? "inativa" : "ativa" });
    }
  };

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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SkeletonMetricCard />
          <SkeletonMetricCard />
          <SkeletonMetricCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas de programas de fidelidade
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => accounts.forEach((a) => recalcAccountM.mutate(a.id))}
            disabled={recalcAccountM.isPending}
          >
            <RefreshCw className={"h-4 w-4 " + (recalcAccountM.isPending ? "animate-spin" : "")} />
            Recalcular tudo
          </Button>
          <Button
            className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <AccountDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
        }}
      />

      <AccountDialog
        mode="edit"
        account={editAccount}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditAccount(undefined);
        }}
      />

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["todas", "pontos", "milhas"] as const).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? "default" : "outline"}
            size="sm"
            className="min-h-[44px]"
            onClick={() => {
              setFilterType(t);
              setCurrentPage(1);
            }}
          >
            {t === "todas" ? "Todas" : t === "pontos" ? "Pontos" : "Milhas"}
          </Button>
        ))}
        <OwnerFilter
          owners={owners}
          value={ownerFilter}
          onChange={(v) => {
            setOwnerFilter(v);
            setCurrentPage(1);
          }}
          className="w-full sm:w-44"
        />
      </div>

      {/* Accounts Table (desktop) + Cards (mobile) */}
      {filteredAccounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma conta encontrada"
          description={
            filterType !== "todas"
              ? "Nenhuma conta encontrada com este filtro. Tente outro tipo."
              : "Toda jornada começa com uma conta. Crie a primeira e acompanhe seu estoque."
          }
          action={{ label: "Nova Conta", onClick: () => setIsCreateDialogOpen(true) }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AccountsTable
              rows={tableRows}
              sort={sort}
              onSort={setSort}
              totals={footerTotals}
              recalcPending={recalcAccountM.isPending}
              onToggleStatus={toggleAccountStatus}
              onEdit={(account) => {
                setEditAccount(account);
                setIsEditDialogOpen(true);
              }}
              onRecalc={(id) => recalcAccountM.mutate(id)}
              onDelete={(id) => deleteAccountM.mutate(id)}
              onOpenAlerts={(account) => setAlertsAccount(account)}
            />
          </div>
          <div className="grid gap-6 md:hidden">
            {paginatedAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                computedBalance={computedBalances.get(account.id) ?? account.balance}
                ownerName={ownerName(account.ownerId)}
                ownerColor={ownerColor(account.ownerId)}
                programName={programName(account.programId)}
                unreadCount={unreadCount(account.id)}
                lastEntryDate={lastActivityByAccount.get(account.id)?.lastEntry?.date}
                lastSaleDate={lastActivityByAccount.get(account.id)?.lastSale?.date}
                avgUnitCost={
                  avgUnitCost(
                    account.totalInvested,
                    computedBalances.get(account.id) ?? account.balance,
                  ) ?? undefined
                }
                recalcPending={recalcAccountM.isPending}
                onToggleStatus={() => toggleAccountStatus(account.id)}
                onEdit={() => {
                  setEditAccount(account);
                  setIsEditDialogOpen(true);
                }}
                onRecalc={() => recalcAccountM.mutate(account.id)}
                onDelete={() => deleteAccountM.mutate(account.id)}
                onOpenAlerts={() => setAlertsAccount(account)}
              />
            ))}
          </div>
        </>
      )}

      {filteredAccounts.length > ITEMS_PER_PAGE && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)} de{" "}
            {filteredAccounts.length}
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Faixa-resumo (substitui o AccountsSummary de 4 cards) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground tabular-nums">
            {summaryStrip.active}/{summaryStrip.total}
          </strong>{" "}
          ativas
        </span>
        <span>
          Total pontos:{" "}
          <strong className="text-foreground tabular-nums">
            {summaryStrip.pontos.toLocaleString("pt-BR")}
          </strong>
        </span>
        <span>
          Total milhas:{" "}
          <strong className="text-foreground tabular-nums">
            {summaryStrip.milhas.toLocaleString("pt-BR")}
          </strong>
        </span>
      </div>

      {alertsAccount && (
        <AccountAlertsDialog
          account={alertsAccount}
          open
          onOpenChange={(open) => {
            if (!open) setAlertsAccount(null);
          }}
        />
      )}
    </div>
  );
}
