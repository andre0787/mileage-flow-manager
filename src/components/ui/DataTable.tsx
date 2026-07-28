/**
 * DataTable — Tabela responsiva com busca, paginação e estados.
 *
 * Encapsula padrões comuns das páginas do app:
 * - Busca por texto com SearchInput
 * - Paginação
 * - Estado vazio com EmptyState
 * - Cards responsivos (1 col mobile, tabela full desktop)
 *
 * Uso:
 *   <DataTable
 *     data={entries}
 *     columns={[
 *       { key: "date", label: "Data", render: (e) => formatDate(e.date) },
 *       { key: "amount", label: "Valor", render: (e) => format(e.amount) },
 *     ]}
 *     searchValue={search}
 *     onSearchChange={setSearch}
 *     searchPlaceholder="Buscar entradas..."
 *     emptyTitle="Nenhuma entrada encontrada"
 *     emptyAction={{ label: "Nova entrada", onClick: () => {} }}
 *   />
 *
 * ponytail: dependências shadcn/ui + SearchInput + EmptyState
 */

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
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

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  /** Oculta em mobile (< sm) */
  hideOnMobile?: boolean;
  /** Oculta em tablet (< md) */
  hideOnTablet?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;

  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Pagination
  pageSize?: number;
  showPagination?: boolean;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };

  // Loading
  loading?: boolean;
  loadingRows?: number;

  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  pageSize = 20,
  showPagination = true,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  emptyAction,
  loading = false,
  loadingRows = 5,
  className = "",
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  // Reset page when data changes
  useMemo(() => {
    if (currentPage > Math.ceil(data.length / pageSize)) {
      setCurrentPage(1);
    }
  }, [data.length, pageSize]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: loadingRows }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {onSearchChange && (
        <SearchInput
          value={searchValue || ""}
          onChange={(v) => {
            onSearchChange(v);
            setCurrentPage(1);
          }}
          placeholder={searchPlaceholder}
        />
      )}

      {/* Desktop table */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`${
                    col.hideOnTablet ? "hidden md:table-cell" : ""
                  } ${col.className || ""}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40">
                  <EmptyState
                    icon={Search}
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`${
                        col.hideOnMobile ? "hidden sm:table-cell" : ""
                      } ${
                        col.hideOnTablet ? "hidden md:table-cell" : ""
                      } ${col.className || ""}`}
                    >
                      {col.render(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <EmptyState
            icon={Search}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : (
          paginatedData.map((item) => (
            <div
              key={keyExtractor(item)}
              className="rounded-lg border bg-card p-3 space-y-2 shadow-sm"
            >
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground text-xs">
                      {col.label}
                    </span>
                    <span>{col.render(item)}</span>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
