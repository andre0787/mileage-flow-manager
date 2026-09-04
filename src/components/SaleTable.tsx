import { useState, useMemo } from "react";
import { Package, TrendingDown } from "lucide-react";
import { useOnlineStatus } from "@/contexts/OnlineContext";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { sortByKey, type SortState } from "@/lib/sort";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { SaleTableRow } from "@/components/sales/SaleTableRow";
import { SaleMobileCard } from "@/components/sales/SaleMobileCard";
import { SaleCancelDialog } from "@/components/sales/SaleCancelDialog";
import type { Sale } from "@/types";

interface SaleTableProps {
  sales: Sale[];
  /** Mapa nome do dono → cor customizada (hex) ou null (fallback por hash). */
  ownerCustomColors?: Record<string, string | null>;
  onCancel?: (saleId: string) => void;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, amount: number) => void;
  onCreateClick?: () => void;
  onEdit?: (sale: Sale) => void;
}

const ITEMS_PER_PAGE = 20;

export function SaleTable({
  sales,
  ownerCustomColors,
  onCancel,
  onStatusChange,
  onReceive,
  onCreateClick,
  onEdit,
}: SaleTableProps) {
  const { isOnline } = useOnlineStatus();
  const customColor = (ownerName: string) => ownerCustomColors?.[ownerName] ?? null;
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: "Data", dir: "desc" });

  const getSortValue = (sale: Sale, col: string): unknown => {
    switch (col) {
      case "Data":
        return new Date(sale.date).getTime();
      case "Dono/Programa":
        return `${sale.ownerName} ${sale.program}`.toLowerCase();
      case "Cliente":
        return sale.clientName.toLowerCase();
      case "Milhas":
        return sale.milesUsed;
      case "Valor":
        return sale.saleValue;
      case "Pendente":
        return sale.saleValue - (sale.amountReceived ?? 0);
      case "Lucro":
        return sale.profit;
      case "Margem":
        return sale.profitMargin;
      case "Status":
        return sale.status;
      default:
        return "";
    }
  };

  const sortedSales = useMemo(
    () => sortByKey(sales, sort.key, sort.dir, (s) => getSortValue(s, sort.key)),
    [sales, sort],
  );

  const totalPages = Math.ceil(sortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = sortedSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (sales.length === 0) {
    return (
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <EmptyState
              icon={Package}
              title="Nenhuma venda encontrada"
              description="Milhas no estoque esperando uma oportunidade. Registre sua primeira venda e veja o lucro acontecer."
              action={onCreateClick ? { label: "Nova Venda", onClick: onCreateClick } : undefined}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card animate-appear animate-delay-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Histórico de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <Table striped>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Data" sortKey="Data" sort={sort} onSort={setSort} />
                  <SortableHeader
                    label="Dono/Programa"
                    sortKey="Dono/Programa"
                    sort={sort}
                    onSort={setSort}
                  />
                  <SortableHeader label="Cliente" sortKey="Cliente" sort={sort} onSort={setSort} />
                  <SortableHeader
                    label="Milhas"
                    sortKey="Milhas"
                    sort={sort}
                    onSort={setSort}
                    className="text-right tabular-nums"
                  />
                  <SortableHeader
                    label="Valor"
                    sortKey="Valor"
                    sort={sort}
                    onSort={setSort}
                    className="text-right tabular-nums"
                  />
                  <SortableHeader
                    label="Pendente"
                    sortKey="Pendente"
                    sort={sort}
                    onSort={setSort}
                    className="text-right tabular-nums"
                  />
                  <SortableHeader
                    label="Lucro"
                    sortKey="Lucro"
                    sort={sort}
                    onSort={setSort}
                    className="text-right tabular-nums"
                  />
                  <SortableHeader
                    label="Margem"
                    sortKey="Margem"
                    sort={sort}
                    onSort={setSort}
                    className="text-right tabular-nums"
                  />
                  <SortableHeader label="Status" sortKey="Status" sort={sort} onSort={setSort} />
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => (
                  <SaleTableRow
                    key={sale.id}
                    sale={sale}
                    customColorHex={customColor(sale.ownerName)}
                    isOnline={isOnline}
                    onStatusChange={onStatusChange}
                    onReceive={onReceive}
                    onEdit={onEdit}
                    onCancelClick={setCancelConfirmId}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {paginatedSales.map((sale) => (
              <SaleMobileCard
                key={sale.id}
                sale={sale}
                customColorHex={customColor(sale.ownerName)}
                onStatusChange={onStatusChange}
                onReceive={onReceive}
                onEdit={onEdit}
                onCancelClick={setCancelConfirmId}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {sortedSales.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, sortedSales.length)} de {sortedSales.length}
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <SaleCancelDialog
        cancelConfirmId={cancelConfirmId}
        onOpenChange={(open) => {
          if (!open) setCancelConfirmId(null);
        }}
        onConfirmCancel={(saleId) => {
          onCancel?.(saleId);
          setCancelConfirmId(null);
        }}
      />
    </>
  );
}
