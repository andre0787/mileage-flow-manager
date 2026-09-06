import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { AccountTableRow } from "@/components/accounts/AccountTableRow";
import type { SortState } from "@/lib/sort";
import type { Account } from "@/types";

export interface AccountsTableRow {
  account: Account;
  computedBalance: number;
  receivable: number;
  ownerName: string;
  programName: string;
  unreadCount: number;
  lastEntryDate?: string;
  lastSaleDate?: string;
}

interface AccountsTableProps {
  rows: AccountsTableRow[];
  sort: SortState | null;
  onSort: (next: SortState) => void;
  totals: { count: number; saldo: number; investido: number; receber: number };
  recalcPending: boolean;
  onToggleStatus: (id: string) => void;
  onEdit: (account: Account) => void;
  onRecalc: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenAlerts: (account: Account) => void;
}

const NUM = "text-right";

export function AccountsTable({
  rows,
  sort,
  onSort,
  totals,
  recalcPending,
  onToggleStatus,
  onEdit,
  onRecalc,
  onDelete,
  onOpenAlerts,
}: AccountsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const emptySort: SortState = { key: "", dir: "asc" };
  return (
    <div className="rounded-md border max-h-[60vh] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <SortableHeader
              label="Conta"
              sortKey="conta"
              sort={sort ?? emptySort}
              onSort={onSort}
            />
            <TableCell className="font-medium text-muted-foreground">Programa</TableCell>
            <TableCell className="font-medium text-muted-foreground">Dono</TableCell>
            <SortableHeader
              label="Saldo"
              sortKey="saldo"
              sort={sort ?? emptySort}
              onSort={onSort}
              className={NUM}
            />
            <SortableHeader
              label="Investido"
              sortKey="investido"
              sort={sort ?? emptySort}
              onSort={onSort}
              className={NUM}
            />
            <SortableHeader
              label="A receber"
              sortKey="receber"
              sort={sort ?? emptySort}
              onSort={onSort}
              className={NUM}
            />
            <TableCell className="font-medium text-muted-foreground">Status</TableCell>
            <TableCell className="font-medium text-muted-foreground">Alertas</TableCell>
            <TableCell className="font-medium text-muted-foreground">Ações</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <AccountTableRow
              key={r.account.id}
              account={r.account}
              computedBalance={r.computedBalance}
              receivable={r.receivable}
              ownerName={r.ownerName}
              programName={r.programName}
              unreadCount={r.unreadCount}
              lastEntryDate={r.lastEntryDate}
              lastSaleDate={r.lastSaleDate}
              recalcPending={recalcPending}
              expanded={expandedId === r.account.id}
              onToggleExpand={() =>
                setExpandedId((cur) => (cur === r.account.id ? null : r.account.id))
              }
              onToggleStatus={() => onToggleStatus(r.account.id)}
              onEdit={() => onEdit(r.account)}
              onRecalc={() => onRecalc(r.account.id)}
              onDelete={() => onDelete(r.account.id)}
              onOpenAlerts={() => onOpenAlerts(r.account)}
            />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-semibold">
              Total ({totals.count} contas)
            </TableCell>
            <TableCell className={`${NUM} font-semibold tabular-nums`}>
              {totals.saldo.toLocaleString("pt-BR")}
            </TableCell>
            <TableCell className={`${NUM} font-semibold tabular-nums`}>
              R$ {totals.investido.toLocaleString("pt-BR")}
            </TableCell>
            <TableCell className={`${NUM} font-semibold tabular-nums`}>
              R$ {totals.receber.toLocaleString("pt-BR")}
            </TableCell>
            <TableCell colSpan={3} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
