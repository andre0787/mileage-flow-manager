import { useState, useMemo } from "react";
import { Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/contexts/OnlineContext";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { formatDateBR } from "@/lib/dateUtils";
import { sortByKey, type SortState } from "@/lib/sort";
import { ownerColor, ownerColorSoft } from "@/lib/ownerColors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import { Pagination } from "@/components/Pagination";
import type { PointEntry, Account, OrigemType, Program, Owner } from "@/types";

const ITEMS_PER_PAGE = 20;

export interface EntryTableProps {
  type: "pontos" | "milhas";
  entries: PointEntry[];
  accounts: Account[];
  origemTypes: OrigemType[];
  programs: Program[];
  owners: Owner[];
  onEdit: (entry: PointEntry) => void;
  onConfirm: (entry: PointEntry) => void;
  onCreateClick?: () => void;
}

export function getOrigemTypeName(
  id: string,
  origemTypes: OrigemType[],
  programs: Program[],
): string {
  const ot = origemTypes.find((item) => item.id === id);
  if (ot) return ot.name;
  const prog = programs.find((p) => p.id === id);
  return prog?.name ?? id;
}

export function getSortValue(
  entry: PointEntry,
  col: string,
  accounts: Account[],
  origemTypes: OrigemType[],
  programs: Program[],
): unknown {
  switch (col) {
    case "Data":
      return new Date(entry.date).getTime();
    case "Conta":
      return accounts.find((a) => a.id === entry.accountId)?.name ?? "";
    case "Origem":
      return getOrigemTypeName(entry.origemTypeId, origemTypes, programs).toLowerCase();
    case "Pontos":
      return entry.amount;
    case "Milhas Geradas":
    case "Milhas":
      return entry.milesGenerated ?? entry.amount;
    case "Valor Pago":
      return entry.amountPaid;
    case "Taxa Conv.":
      return entry.conversionRate ?? 0;
    case "Custo/Milha":
      return entry.costPerMile ?? 0;
    default:
      return "";
  }
}

interface EntryBadgesProps {
  entry: PointEntry;
  isPontos: boolean;
  origemTypes: OrigemType[];
  origemName: string;
}

function EntryBadges({ entry, isPontos, origemTypes, origemName }: EntryBadgesProps) {
  const color = origemTypes.find((ot) => ot.id === entry.origemTypeId)?.color;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="outline" className="gap-1">
        {isPontos && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
        {origemName}
      </Badge>
      {entry.cartAmount && entry.cartAmount > 0 ? (
        <Badge variant="secondary" className="text-[10px] h-5 gap-1">
          🛒 Carrinho
        </Badge>
      ) : null}
      {entry.recurrenceInterval && entry.entryStatus !== "aguardando" ? (
        <Badge
          variant="secondary"
          className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          🔄 Clube
        </Badge>
      ) : null}
      {entry.entryStatus === "aguardando" && <StatusBadge status="aguardando" size="sm" />}
    </div>
  );
}

interface EntryActionsProps {
  entry: PointEntry;
  isOnline: boolean;
  onConfirm: (entry: PointEntry) => void;
  onEdit: (entry: PointEntry) => void;
}

function EntryActions({ entry, isOnline, onConfirm, onEdit }: EntryActionsProps) {
  return (
    <div className="flex gap-2 justify-end">
      {entry.entryStatus === "aguardando" && (
        <Button
          size="sm"
          variant="outline"
          className="px-3 min-h-[44px] gap-1 border-primary/40 dark:border-primary/60"
          onClick={() => onConfirm(entry)}
          disabled={!isOnline}
          title={!isOnline ? "Requer conexão" : undefined}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          Confirmar
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="px-3 min-h-[44px]"
        onClick={() => onEdit(entry)}
        disabled={!isOnline}
        title={!isOnline ? "Requer conexão" : undefined}
      >
        Editar
      </Button>
      <DeleteEntryDialog entry={entry} />
    </div>
  );
}

interface EntryTableRowProps {
  entry: PointEntry;
  isPontos: boolean;
  account?: Account;
  ownerNameStr: string;
  donoCustomColorHex: string | null;
  origemName: string;
  origemTypes: OrigemType[];
  isOnline: boolean;
  onEdit: (entry: PointEntry) => void;
  onConfirm: (entry: PointEntry) => void;
}

function EntryTableRow({
  entry,
  isPontos,
  account,
  ownerNameStr,
  donoCustomColorHex,
  origemName,
  origemTypes,
  isOnline,
  onEdit,
  onConfirm,
}: EntryTableRowProps) {
  const textColor = ownerColor(ownerNameStr, donoCustomColorHex);

  return (
    <TableRow>
      <TableCell className="hidden md:table-cell">{formatDateBR(entry.date)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <p className="font-medium">{account?.name}</p>
        <p className="text-xs font-medium" style={{ color: textColor }}>
          {ownerNameStr}
        </p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <EntryBadges
          entry={entry}
          isPontos={isPontos}
          origemTypes={origemTypes}
          origemName={origemName}
        />
      </TableCell>
      {isPontos ? (
        <>
          <TableCell className="hidden md:table-cell text-right tabular-nums">
            {entry.amount.toLocaleString("pt-BR")}
          </TableCell>
          <TableCell className="hidden md:table-cell text-right tabular-nums">
            R$ {entry.amountPaid.toLocaleString("pt-BR")}
          </TableCell>
          <TableCell className="hidden md:table-cell text-right tabular-nums">
            {entry.conversionRate ?? "-"}
          </TableCell>
          <TableCell className="hidden md:table-cell text-right tabular-nums font-semibold text-success">
            {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
          </TableCell>
        </>
      ) : (
        <>
          <TableCell className="hidden md:table-cell text-right tabular-nums">
            {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
          </TableCell>
          <TableCell className="hidden md:table-cell text-right tabular-nums">
            R$ {entry.amountPaid.toLocaleString("pt-BR")}
          </TableCell>
        </>
      )}
      <TableCell className="hidden md:table-cell text-right tabular-nums">
        R$ {(entry.costPerMile ?? 0).toFixed(4)}
      </TableCell>
      <TableCell className="hidden md:table-cell text-right">
        <EntryActions entry={entry} isOnline={isOnline} onConfirm={onConfirm} onEdit={onEdit} />
      </TableCell>
    </TableRow>
  );
}

interface EntryMobileCardProps {
  entry: PointEntry;
  isPontos: boolean;
  account?: Account;
  ownerNameStr: string;
  donoCustomColorHex: string | null;
  origemName: string;
  onEdit: (entry: PointEntry) => void;
  onConfirm: (entry: PointEntry) => void;
}

function EntryMobileCard({
  entry,
  isPontos,
  account,
  ownerNameStr,
  donoCustomColorHex,
  origemName,
  onEdit,
  onConfirm,
}: EntryMobileCardProps) {
  const donoColor = ownerColor(ownerNameStr, donoCustomColorHex);
  const donoSoft = ownerColorSoft(ownerNameStr, donoCustomColorHex);

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="font-medium">{origemName}</p>
            {entry.cartAmount && entry.cartAmount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                🛒 Carrinho
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatDateBR(entry.date)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline">{account?.name}</Badge>
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: donoSoft, color: donoColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: donoColor }} />
            {ownerNameStr}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {entry.recurrenceInterval && entry.entryStatus !== "aguardando" && (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] gap-1"
          >
            🔄 Clube
          </Badge>
        )}
        {entry.entryStatus === "aguardando" && (
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary text-[10px] gap-1"
          >
            ⏳ Aguardando
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">{isPontos ? "Pontos:" : "Milhas:"}</span>
          <p className="font-semibold">
            {isPontos
              ? entry.amount.toLocaleString("pt-BR")
              : (entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor Pago:</span>
          <p className="font-semibold">R$ {entry.amountPaid.toLocaleString("pt-BR")}</p>
        </div>
        {isPontos && (
          <div>
            <span className="text-muted-foreground">Milhas Geradas:</span>
            <p className="font-semibold text-success">
              {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Custo/Milha:</span>
          <p className="font-semibold">R$ {(entry.costPerMile ?? 0).toFixed(4)}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {entry.entryStatus === "aguardando" && (
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] gap-1 border-primary/40 dark:border-primary/60"
            onClick={() => onConfirm(entry)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Confirmar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="px-3 min-h-[44px]"
          onClick={() => onEdit(entry)}
        >
          Editar
        </Button>
        <DeleteEntryDialog entry={entry} />
      </div>
    </div>
  );
}

export function EntryTable({
  type,
  entries,
  accounts,
  origemTypes,
  programs,
  owners,
  onEdit,
  onConfirm,
  onCreateClick,
}: EntryTableProps) {
  const { isOnline } = useOnlineStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const isPontos = type === "pontos";
  const [sort, setSort] = useState<SortState>({ key: "Data", dir: "desc" });

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const donoCustomColor = (id: string) => owners.find((o) => o.id === id)?.color ?? null;
  const resolveOrigemName = (id: string) => getOrigemTypeName(id, origemTypes, programs);

  const sortedEntries = useMemo(
    () =>
      sortByKey(entries, sort.key, sort.dir, (e) =>
        getSortValue(e, sort.key, accounts, origemTypes, programs),
      ),
    [entries, sort, accounts, origemTypes, programs],
  );

  const totalPages = Math.ceil(sortedEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = sortedEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const desktopColumns = isPontos
    ? [
        "Data",
        "Conta",
        "Origem",
        "Pontos",
        "Valor Pago",
        "Taxa Conv.",
        "Milhas",
        "Custo/Milha",
        "Ações",
      ]
    : ([
        "Data",
        "Conta",
        "Origem",
        "Milhas Geradas",
        "Valor Pago",
        "Custo/Milha",
        "Ações",
      ] as const);

  const numericCols = isPontos
    ? ["Pontos", "Valor Pago", "Taxa Conv.", "Milhas", "Custo/Milha"]
    : ["Milhas Geradas", "Valor Pago", "Custo/Milha"];

  const emptyStateText = `Nenhuma entrada de ${type === "pontos" ? "pontos" : "milhas"}`;
  const emptyStateDesc = `Registre sua primeira aquisição de ${type === "pontos" ? "pontos" : "milhas"} ou use a busca para filtrar.`;

  return (
    <>
      <div className="overflow-x-auto">
        <Table striped>
          <TableHeader>
            <TableRow>
              {desktopColumns.map((col) =>
                col === "Ações" ? (
                  <TableHead key={col} className="hidden md:table-cell text-right">
                    Ações
                  </TableHead>
                ) : (
                  <SortableHeader
                    key={col}
                    label={col}
                    sortKey={col}
                    sort={sort}
                    onSort={setSort}
                    className={`hidden md:table-cell ${numericCols.includes(col) ? "text-right tabular-nums" : ""}`}
                  />
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={desktopColumns.length} className="py-12">
                  <EmptyState
                    icon={Package}
                    title={emptyStateText}
                    description={emptyStateDesc}
                    action={
                      onCreateClick ? { label: "Nova Entrada", onClick: onCreateClick } : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedEntries.map((entry) => {
                const account = accounts.find((a) => a.id === entry.accountId);
                const ownerId = account?.ownerId ?? "";
                const ownerNameStr = ownerName(ownerId);
                const customColorHex = donoCustomColor(ownerId);
                const origemName = resolveOrigemName(entry.origemTypeId);

                return (
                  <EntryTableRow
                    key={entry.id}
                    entry={entry}
                    isPontos={isPontos}
                    account={account}
                    ownerNameStr={ownerNameStr}
                    donoCustomColorHex={customColorHex}
                    origemName={origemName}
                    origemTypes={origemTypes}
                    isOnline={isOnline}
                    onEdit={onEdit}
                    onConfirm={onConfirm}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 mt-4">
        {sortedEntries.length === 0 ? (
          <EmptyState
            icon={Package}
            title={emptyStateText}
            description={emptyStateDesc}
            action={onCreateClick ? { label: "Nova Entrada", onClick: onCreateClick } : undefined}
          />
        ) : (
          paginatedEntries.map((entry) => {
            const account = accounts.find((a) => a.id === entry.accountId);
            const ownerId = account?.ownerId ?? "";
            const ownerNameStr = ownerName(ownerId);
            const customColorHex = donoCustomColor(ownerId);
            const origemName = resolveOrigemName(entry.origemTypeId);

            return (
              <EntryMobileCard
                key={entry.id}
                entry={entry}
                isPontos={isPontos}
                account={account}
                ownerNameStr={ownerNameStr}
                donoCustomColorHex={customColorHex}
                origemName={origemName}
                onEdit={onEdit}
                onConfirm={onConfirm}
              />
            );
          })
        )}
      </div>

      {sortedEntries.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedEntries.length)} de {sortedEntries.length}
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
}
