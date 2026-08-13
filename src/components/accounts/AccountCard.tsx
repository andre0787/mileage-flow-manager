import { AlertTriangle, Bell, Edit, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateBR } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

interface AccountCardProps {
  account: Account;
  computedBalance: number;
  ownerName: string;
  programName: string;
  unreadCount: number;
  lastEntryDate?: string;
  lastSaleDate?: string;
  recalcPending: boolean;
  onToggleStatus: () => void;
  onEdit: () => void;
  onRecalc: () => void;
  onDelete: () => void;
  onOpenAlerts: () => void;
}

export function AccountCard({
  account,
  computedBalance,
  ownerName,
  programName,
  unreadCount,
  lastEntryDate,
  lastSaleDate,
  recalcPending,
  onToggleStatus,
  onEdit,
  onRecalc,
  onDelete,
  onOpenAlerts,
}: AccountCardProps) {
  const balanceMismatch = computedBalance !== account.balance;

  return (
    <Card className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-200">
      <CardHeader className="pb-3 bg-gradient-card">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{account.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{programName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-1.5 hover:bg-muted transition-colors"
              onClick={onOpenAlerts}
              aria-label={`Alertas de ${account.name}`}
              title="Alertas da conta"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white px-1">
                  {unreadCount}
                </span>
              )}
            </button>
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
            <span className="font-semibold">{computedBalance.toLocaleString("pt-BR")}</span>
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
              <span className="font-semibold text-success">
                R$ {account.totalInvested.toLocaleString("pt-BR")}
              </span>
            </div>
          )}
          {balanceMismatch && (
            <div className="flex items-center justify-between text-xs text-amber-600">
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Saldo registrado:
              </span>
              <span>{account.balance.toLocaleString("pt-BR")}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Dono:</span>
            <span className="text-sm font-medium">{ownerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Última entrada:</span>
            <span className="text-sm font-medium">
              {lastEntryDate ? formatDateBR(lastEntryDate) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Última venda:</span>
            <span className="text-sm font-medium">
              {lastSaleDate ? formatDateBR(lastSaleDate) : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleStatus}
            className="flex-1 min-h-[44px]"
          >
            {account.status === "ativa" ? "Desativar" : "Ativar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] min-w-[44px]"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] min-w-[44px]"
            onClick={onRecalc}
            disabled={recalcPending}
            title="Recalcular saldo (entradas - vendas)"
          >
            <RefreshCw className={cn("h-4 w-4", recalcPending && "animate-spin")} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
