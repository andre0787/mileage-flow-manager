import { Edit, Trash2, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { parseOrigemTypeDescription } from "@/lib/origemTypes";
import type { OrigemType, PointEntry } from "@/types";

interface OrigemTypeTableProps {
  milhasTypes: OrigemType[];
  entries: PointEntry[];
  onEdit: (ot: OrigemType) => void;
  onDelete: (id: string) => void;
}

export function OrigemTypeTable({ milhasTypes, entries, onEdit, onDelete }: OrigemTypeTableProps) {
  const isTypeInUse = (id: string) => entries.some((e) => e.origemTypeId === id);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> Tipos de Operação
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Nome</TableHead>
                <TableHead className="hidden md:table-cell">Cor</TableHead>
                <TableHead className="hidden md:table-cell">Recorrência</TableHead>
                <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milhasTypes.map((ot) => {
                const hasRecurrence = parseOrigemTypeDescription(ot.description).hasRecurrence;
                const disabled = isTypeInUse(ot.id);
                return (
                  <TableRow key={ot.id}>
                    <TableCell className="hidden md:table-cell font-medium">{ot.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: ot.color }}
                        />
                        <span className="text-xs font-mono">{ot.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={hasRecurrence ? "default" : "secondary"}>
                        {hasRecurrence ? "Mensal" : "Avulsa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3 min-h-[44px] min-w-[44px]"
                          onClick={() => onEdit(ot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DeleteConfirmDialog
                          trigger={
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-3 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                              disabled={disabled}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Excluir tipo de operação?"
                          description={
                            disabled
                              ? `Não é possível excluir o tipo "${ot.name}" pois existem entradas vinculadas. Remova as entradas primeiro.`
                              : `Tem certeza que deseja excluir o tipo "${ot.name}"? Esta ação não pode ser desfeita e removerá permanentemente o registro.`
                          }
                          confirmLabel="Excluir tipo"
                          onConfirm={() => onDelete(ot.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3 mt-4">
          {milhasTypes.map((ot) => {
            const hasRecurrence = parseOrigemTypeDescription(ot.description).hasRecurrence;
            const disabled = isTypeInUse(ot.id);
            return (
              <div key={ot.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base truncate">{ot.name}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: ot.color }}
                    />
                    <span className="text-xs font-mono text-muted-foreground">{ot.color}</span>
                  </div>
                </div>
                <Badge variant={hasRecurrence ? "default" : "secondary"} className="w-fit">
                  {hasRecurrence ? "Recorrente mensal" : "Avulsa"}
                </Badge>
                <div className="flex gap-2 pt-1 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2 min-h-[44px]"
                    onClick={() => onEdit(ot)}
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </Button>
                  <DeleteConfirmDialog
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 min-h-[44px] text-destructive hover:text-destructive"
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" /> Excluir
                      </Button>
                    }
                    title="Excluir tipo de operação?"
                    description={
                      disabled
                        ? `Não é possível excluir o tipo "${ot.name}" pois existem entradas vinculadas. Remova as entradas primeiro.`
                        : `Tem certeza que deseja excluir o tipo "${ot.name}"? Esta ação não pode ser desfeita e removerá permanentemente o registro.`
                    }
                    confirmLabel="Excluir tipo"
                    onConfirm={() => onDelete(ot.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {milhasTypes.length === 0 && (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum tipo de origem cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
