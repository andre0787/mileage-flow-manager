import { useState } from "react";
import { Plus, CreditCard, Eye, EyeOff, Edit, Trash2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/contexts/DataContext";
import AccountDialog from "@/components/AccountDialog";
import type { Account } from "@/types";

export default function Contas() {
  const { accounts, owners, programs, updateAccount, deleteAccount } = useData();
  const [filterType, setFilterType] = useState<"todas" | "pontos" | "milhas">("todas");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredAccounts = filterType === "todas"
    ? accounts
    : accounts.filter(a => a.type === filterType);

  const ownerName = (id: string) => owners.find(o => o.id === id)?.name ?? id;
  const programName = (id: string) => programs.find(p => p.id === id)?.name ?? id;

  const toggleAccountStatus = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
      updateAccount(id, { status: account.status === "ativa" ? "inativa" : "ativa" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contas</h1>
          <p className="text-muted-foreground">
            Gerencie suas contas de programas de fidelidade
          </p>
        </div>

        <Button className="gap-2 bg-gradient-primary hover:opacity-90" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <AccountDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={(open) => { setIsCreateDialogOpen(open); }}
      />

      <AccountDialog
        mode="edit"
        account={editAccount}
        open={isEditDialogOpen}
        onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditAccount(undefined); }}
      />

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["todas", "pontos", "milhas"] as const).map((t) => (
          <Button key={t} variant={filterType === t ? "default" : "outline"} size="sm" onClick={() => setFilterType(t)}>
            {t === "todas" ? "Todas" : t === "pontos" ? "Pontos" : "Milhas"}
          </Button>
        ))}
      </div>

      {/* Accounts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAccounts.map((account) => (
          <Card key={account.id} className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="pb-3 bg-gradient-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{programName(account.programId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={account.type === "pontos" ? "secondary" : "default"}>
                    {account.type === "pontos" ? "Pontos" : "Milhas"}
                  </Badge>
                  <Badge variant={account.status === "ativa" ? "default" : "secondary"}>
                    {account.status === "ativa" ? (
                      <><Eye className="h-3 w-3 mr-1" />Ativa</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" />Inativa</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Saldo:</span>
                  <span className="font-semibold">{account.balance.toLocaleString('pt-BR')}</span>
                </div>
                {account.averageCostPerMile != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Custo/Milha:</span>
                    <span className="font-semibold">R$ {account.averageCostPerMile.toFixed(4)}</span>
                  </div>
                )}
                {account.totalInvested != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor Investido:</span>
                    <span className="font-semibold text-success">R$ {account.totalInvested.toLocaleString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dono:</span>
                  <span className="text-sm font-medium">{ownerName(account.ownerId)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => toggleAccountStatus(account.id)} className="flex-1">
                  {account.status === "ativa" ? "Desativar" : "Ativar"}
                </Button>
                <Button size="sm" variant="outline" className="px-3" onClick={() => { setEditAccount(account); setIsEditDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="px-3 text-destructive hover:text-destructive" onClick={() => deleteAccount(account.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Resumo das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total de Contas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">{accounts.filter(a => a.status === "ativa").length}</p>
              <p className="text-sm text-muted-foreground">Contas Ativas</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter(a => a.type === "pontos").reduce((s, a) => s + a.balance, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Total Pontos</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success-light">
              <p className="text-2xl font-bold text-success">
                {accounts.filter(a => a.type === "milhas").reduce((s, a) => s + a.balance, 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-muted-foreground">Total Milhas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
