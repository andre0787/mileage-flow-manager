import { AlertTriangle } from "lucide-react";
import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { AccountActions } from "@/components/accounts/AccountActions";
import { formatUnitCost } from "@/lib/unitCost";
import { AccountAlertBell } from "@/components/accounts/AccountAlertBell";
import { AccountRowExpand } from "@/components/accounts/AccountRowExpand";
import type { Account } from "@/types";

export interface AccountTableRowProps {
  account: Account;
  computedBalance: number;
  receivable: number;
  ownerName: string;
  /** Hex custom do dono (owners.color) — null usa fallback por hash. */
  ownerColorHex?: string | null;
  programName: string;
  unreadCount: number;
  lastEntryDate?: string;
  lastSaleDate?: string;
  /** Valor médio por unidade do saldo (investido ÷ saldo) — undefined sem dado. */
  avgUnitCost?: number;
  recalcPending: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onEdit: () => void;
  onRecalc: () => void;
  onDelete: () => void;
  onOpenAlerts: () => void;
}

const NUM = "text-right tabular-nums";

export function AccountTableRow({
  account,
  computedBalance,
  receivable,
  ownerName,
  ownerColorHex = null,
  programName,
  unreadCount,
  lastEntryDate,
  lastSaleDate,
  avgUnitCost,
  recalcPending,
  expanded,
  onToggleExpand,
  onToggleStatus,
  onEdit,
  onRecalc,
  onDelete,
  onOpenAlerts,
}: AccountTableRowProps) {
  const mismatch = computedBalance !== account.balance;
  return (
    <>
      <TableRow
        className="cursor-pointer [&>td]:py-2"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          onToggleExpand();
        }}
        title="Clique para expandir os detalhes"
      >
        <TableCell className="font-medium">{account.name}</TableCell>
        <TableCell className="text-muted-foreground">{programName}</TableCell>
        <TableCell>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: ownerColorSoft(ownerName, ownerColorHex),
              color: ownerColor(ownerName, ownerColorHex),
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: ownerColor(ownerName, ownerColorHex) }}
            />
            {ownerName}
          </span>
        </TableCell>
        <TableCell
          className={NUM}
          title="Valor médio por ponto/milha do saldo atual (investido ÷ saldo)"
        >
          {avgUnitCost != null ? formatUnitCost(avgUnitCost) : "—"}
        </TableCell>
        <TableCell className={NUM}>
          <span className="inline-flex items-center gap-1 font-semibold">
            {mismatch && (
              <span title={`Saldo registrado: ${account.balance.toLocaleString("pt-BR")}`}>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              </span>
            )}
            {computedBalance.toLocaleString("pt-BR")}
          </span>
        </TableCell>
        <TableCell className={NUM}>
          {account.totalInvested != null
            ? `R$ ${account.totalInvested.toLocaleString("pt-BR")}`
            : "—"}
        </TableCell>
        <TableCell className={NUM}>
          {receivable > 0 ? `R$ ${receivable.toLocaleString("pt-BR")}` : "—"}
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1">
            <Badge variant={account.type === "pontos" ? "secondary" : "default"}>
              {account.type === "pontos" ? "Pontos" : "Milhas"}
            </Badge>
            <Badge variant={account.status === "ativa" ? "default" : "secondary"}>
              {account.status === "ativa" ? "Ativa" : "Inativa"}
            </Badge>
          </span>
        </TableCell>
        <TableCell>
          <AccountAlertBell
            accountName={account.name}
            unreadCount={unreadCount}
            onOpen={onOpenAlerts}
          />
        </TableCell>
        <TableCell>
          <AccountActions
            isActive={account.status === "ativa"}
            recalcPending={recalcPending}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            onRecalc={onRecalc}
            onDelete={onDelete}
          />
        </TableCell>
      </TableRow>
      {expanded && (
        <AccountRowExpand
          colSpan={10}
          averageCostPerMile={account.averageCostPerMile}
          lastEntryDate={lastEntryDate}
          lastSaleDate={lastSaleDate}
          ownerName={ownerName}
          programName={programName}
        />
      )}
    </>
  );
}
