import { useState, useMemo } from "react";
import { Package } from "lucide-react";
import { useOnlineStatus } from "@/contexts/OnlineContext";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { sortByKey, type SortState } from "@/lib/sort";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { EntryTableRow } from "@/components/entry/EntryTableRow";
import { EntryMobileCard } from "@/components/entry/EntryMobileCard";
import { getSortValue } from "@/components/entry/entryTableUtils";
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

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const ownerMap = useMemo(() => new Map(owners.map((o) => [o.id, o])), [owners]);

  const origemNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ot of origemTypes) {
      map.set(ot.id, ot.name);
    }
    for (const prog of programs) {
      if (!map.has(prog.id)) {
        map.set(prog.id, prog.name);
      }
    }
    return map;
  }, [origemTypes, programs]);

  const sortedEntries = useMemo(
    () =>
      sortByKey(entries, sort.key, sort.dir, (e) =>
        getSortValue(e, sort.key, accountMap, origemNameMap),
      ),
    [entries, sort, accountMap, origemNameMap],
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
                const account = accountMap.get(entry.accountId);
                const ownerId = account?.ownerId ?? "";
                const owner = ownerMap.get(ownerId);
                const ownerNameStr = owner?.name ?? ownerId;
                const customColorHex = owner?.color ?? null;
                const origemName = origemNameMap.get(entry.origemTypeId) ?? entry.origemTypeId;

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
            const account = accountMap.get(entry.accountId);
            const ownerId = account?.ownerId ?? "";
            const owner = ownerMap.get(ownerId);
            const ownerNameStr = owner?.name ?? ownerId;
            const customColorHex = owner?.color ?? null;
            const origemName = origemNameMap.get(entry.origemTypeId) ?? entry.origemTypeId;

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
