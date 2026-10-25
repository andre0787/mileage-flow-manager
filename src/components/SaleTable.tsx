import { useState, useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { useOnlineStatus } from "@/contexts/OnlineContext";
import { sortByKey, type SortState } from "@/lib/sort";
import { Table, TableBody } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";
import { SaleTableRow } from "@/components/sales/SaleTableRow";
import { SaleMobileCard } from "@/components/sales/SaleMobileCard";
import { SaleCancelDialog } from "@/components/sales/SaleCancelDialog";
import { SaleTableHeader } from "@/components/sales/SaleTableHeader";
import { SaleTableEmpty } from "@/components/sales/SaleTableEmpty";
import { getSaleSortValue } from "@/components/sales/saleSort";
import type { Sale } from "@/types";

interface SaleTableProps {
  sales: Sale[];
  ownerCustomColors?: Record<string, string | null>;
  onCancel?: (saleId: string) => void;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onReceive?: (saleId: string, payment: { cash: number; useCredit: number }) => void;
  onRefund?: (saleId: string, amount: number) => void;
  refundPending?: boolean;
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
  onRefund,
  refundPending = false,
  onCreateClick,
  onEdit,
}: SaleTableProps) {
  const { isOnline } = useOnlineStatus();
  const customColor = (ownerName: string) => ownerCustomColors?.[ownerName] ?? null;
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ key: "Data", dir: "desc" });

  const sortedSales = useMemo(
    () => sortByKey(sales, sort.key, sort.dir, (s) => getSaleSortValue(s, sort.key)),
    [sales, sort],
  );

  const totalPages = Math.ceil(sortedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = sortedSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleConfirmCancel = (saleId: string) => {
    onCancel?.(saleId);
    setCancelConfirmId(null);
  };

  if (sales.length === 0) {
    return <SaleTableEmpty onCreateClick={onCreateClick} />;
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
          <div className="overflow-x-auto hidden md:block">
            <Table striped>
              <SaleTableHeader sort={sort} onSort={setSort} />
              <TableBody>
                {paginatedSales.map((sale) => (
                  <SaleTableRow
                    key={sale.id}
                    sale={sale}
                    customColorHex={customColor(sale.ownerName)}
                    isOnline={isOnline}
                    onStatusChange={onStatusChange}
                    onReceive={onReceive}
                    onRefund={onRefund}
                    refundPending={refundPending}
                    onEdit={onEdit}
                    onCancelClick={setCancelConfirmId}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {paginatedSales.map((sale) => (
              <SaleMobileCard
                key={sale.id}
                sale={sale}
                customColorHex={customColor(sale.ownerName)}
                onStatusChange={onStatusChange}
                onReceive={onReceive}
                onRefund={onRefund}
                refundPending={refundPending}
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
        onOpenChange={(open) => !open && setCancelConfirmId(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </>
  );
}
