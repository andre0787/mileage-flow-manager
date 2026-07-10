import { useState } from "react";
import { Package, TrendingDown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/Pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import type { Sale } from "@/types";

interface SaleTableProps {
  sales: Sale[];
  onCancel?: (saleId: string) => void;
  onStatusChange?: (saleId: string, status: "pendente" | "pago" | "concluido") => void;
  onCreateClick?: () => void;
}

const ITEMS_PER_PAGE = 20

export function SaleTable({ sales, onCancel, onStatusChange, onCreateClick }: SaleTableProps) {
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE)
  const paginatedSales = sales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dono/Programa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Milhas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className={sale.status === "cancelado" ? "opacity-50" : ""}
                  >
                    <TableCell>{new Date(sale.date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <p className="font-medium">{sale.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{sale.program}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{sale.clientName}</p>
                      <p className="text-xs text-muted-foreground">{sale.ticketLocator}</p>
                    </TableCell>
                    <TableCell>{sale.milesUsed.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      {"R$ "}
                      {sale.saleValue.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell
                      className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {"R$ "}
                      {sale.profit.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>{sale.profitMargin.toFixed(1)}%</TableCell>
                    <TableCell>
                      {sale.status === "cancelado" ? (
                        <Badge variant="outline" className="text-destructive border-destructive">
                          Cancelado
                        </Badge>
                      ) : (
                        <Select
                          value={sale.status}
                          onValueChange={(v) =>
                            onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")
                          }
                        >
                          <SelectTrigger className="w-28">
                            <span
                              className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`}
                            />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{sale.passengers.length} pax</span>
                        {sale.status !== "cancelado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive h-6 text-xs"
                            onClick={() => setCancelConfirmId(sale.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className={`border rounded-lg p-4 space-y-3 ${sale.status === "cancelado" ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{sale.program}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sale.ownerName} • {new Date(sale.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {sale.status === "cancelado" ? (
                    <Badge
                      variant="outline"
                      className="text-destructive border-destructive shrink-0 ml-2"
                    >
                      Cancelado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`shrink-0 ml-2 ${sale.status === "pendente" ? "text-warning border-warning" : sale.status === "pago" ? "text-primary border-primary" : "text-success border-success"}`}
                    >
                      {sale.status === "pendente"
                        ? "Pendente"
                        : sale.status === "pago"
                          ? "Pago"
                          : "Concluído"}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Cliente:</span>
                    <p className="font-semibold truncate">{sale.clientName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Milhas:</span>
                    <p className="font-semibold">{sale.milesUsed.toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Valor:</span>
                    <p className="font-semibold">
                      {"R$ "}
                      {sale.saleValue.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Lucro:</span>
                    <p
                      className={`font-semibold ${sale.profit < 0 ? "text-destructive" : "text-success"}`}
                    >
                      {"R$ "}
                      {sale.profit.toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {sale.ticketLocator && (
                      <span className="truncate">Localizador: {sale.ticketLocator}</span>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <Users className="h-3 w-3" />
                      {sale.passengers.length} pax
                    </span>
                  </div>
                </div>
                {sale.status !== "cancelado" && (
                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 min-h-[44px]"
                      onClick={() => setCancelConfirmId(sale.id)}
                    >
                      Cancelar
                    </Button>
                    <div className="flex-1">
                      <Select
                        value={sale.status}
                        onValueChange={(v) =>
                          onStatusChange?.(sale.id, v as "pendente" | "pago" | "concluido")
                        }
                      >
                        <SelectTrigger className="w-full min-h-[44px]">
                          <span
                            className={`h-2 w-2 rounded-full ${sale.status === "pendente" ? "bg-warning" : sale.status === "pago" ? "bg-primary" : "bg-success"}`}
                          />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sales.length > ITEMS_PER_PAGE && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sales.length)} de {sales.length}
          </span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <AlertDialog
        open={!!cancelConfirmId}
        onOpenChange={(open) => {
          if (!open) setCancelConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá marcar a venda como cancelada e restaurar o saldo de milhas na conta.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (cancelConfirmId) {
                  onCancel?.(cancelConfirmId);
                  setCancelConfirmId(null);
                }
              }}
            >
              Sim, cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
