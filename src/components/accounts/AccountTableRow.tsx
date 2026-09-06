import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { AccountActions } from "@/components/accounts/AccountActions";
import { AccountAlertBell } from "@/components/accounts/AccountAlertBell";
import { AccountRowExpand } from "@/components/accounts/AccountRowExpand";
import type { Account } from "@/types";

export interface AccountTableRowProps {
  account: Account;
  computedBalance: number;
  receivable: number;
  ownerName: string;
  programName: string;
  unreadCount: number;
  lastEntryDate?: string;
  lastSaleDate?: string;
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
  programName,
  unreadCount,
  lastEntryDate,
  lastSaleDate,
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
        <TableCell>{ownerName}</TableCell>
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
          colSpan={9}
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
