import { useState } from "react";
import { Plus, CreditCard, Eye, EyeOff, Edit, Trash2, Filter, Building2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { SkeletonMetricCard } from "@/components/SkeletonLoader";
import { useData } from "@/contexts/DataContext";
import { useUpdateAccountMutation, useDeleteAccountMutation, useRecalcAccountMutation } from "@/hooks/useDatabase";
import AccountDialog from "@/components/AccountDialog";
import type { Account } from "@/types";

const ITEMS_PER_PAGE = 20

export default function Contas() {
  const { accounts, owners, programs, isLoading } = useData();
  const updateAccountM = useUpdateAccountMutation();
  const deleteAccountM = useDeleteAccountMutation();
  const recalcAccountM = useRecalcAccountMutation();
  const [filterType, setFilterType] = useState<"todas" | "pontos" | "milhas">("todas");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAccounts =
    filterType === "todas" ? accounts : accounts.filter((a) => a.type === filterType);

  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = filteredAccounts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id;

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
            onClick={() => accounts.forEach(a => recalcAccountM.mutate(a.id))}
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
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["todas", "pontos", "milhas"] as const).map((t) => (
          <Button
            key={t}
            variant={filterType === t ? "default" : "outline"}
            size="sm"
            className="min-h-[44px]"
            onClick={() => setFilterType(t)}
          >
            {t === "todas" ? "Todas" : t === "pontos" ? "Pontos" : "Milhas"}
          </Button>
        ))}
      </div>

      {/* Accounts Grid */}
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
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedAccounts.map((account) => (
            <Card
              key={account.id}
              className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200"
            >
              <CardHeader className="pb-3 bg-gradient-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {programName(account.programId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={account.type === "pontos" ? "secondary" : "default"}>
                      {account.type === "pontos" ? "Pontos" : "Milhas"}
                    </Badge>
                    <Badge variant={account.status === "ativa" ? "default" : "secondary"}>
                      {account.status === "ativa" ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Saldo:</span>
                    <span className="font-semibold">{account.balance.toLocaleString("pt-BR")}</span>
                  </div>
                  {account.averageCostPerMile != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Custo/Milha:</span>
                      <span className="font-semibold">
                        R$ {account.averageCostPerMile.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {account.totalInvested != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor Investido:</span>
                      <span className="font-semibold text-success">
                        R$ {account.totalInvested.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dono:</span>
                    <span className="text-sm font-medium">{ownerName(account.ownerId)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAccountStatus(account.id)}
                    className="flex-1 min-h-[44px]"
                  >
                    {account.status === "ativa" ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 min-h-[44px] min-w-[44px]"
                    onClick={() => {
                      setEditAccount(account);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 min-h-[44px] min-w-[44px]"
                    onClick={() => recalcAccountM.mutate(account.id)}
                    disabled={recalcAccountM.isPending}
                    title="Recalcular saldo (entradas - vendas)"
                  >
                    <RefreshCw className={"h-4 w-4 " + (recalcAccountM.isPending ? "animate-spin" : "")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => deleteAccountM.mutate(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAccounts.length > ITEMS_PER_PAGE && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)} de {filteredAccounts.length}
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Summary Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Resumo das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">
                {accounts.filter((a) => a.status === "ativa").length}
              </p>
              <p className="text-sm text-muted-foreground">Contas Ativas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">
                {accounts
                  .filter((a) => a.type === "pontos")
                  .reduce((s, a) => s + a.balance, 0)
                  .toLocaleString("pt-BR")}
              </p>
              <p className="text-sm text-muted-foreground">Total Pontos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">
                {accounts
                  .filter((a) => a.type === "milhas")
                  .reduce((s, a) => s + a.balance, 0)
                  .toLocaleString("pt-BR")}
              </p>
              <p className="text-sm text-muted-foreground">Total Milhas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
