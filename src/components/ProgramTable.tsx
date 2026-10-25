import { Edit, Trash2, Building2 } from "lucide-react";
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
import { ProgramMobileList } from "./ProgramMobileList";
import type { Program, Account } from "@/types";

interface ProgramTableProps {
  programs: Program[];
  accounts: Account[];
  onEdit: (program: Program) => void;
  onDelete: (id: string) => void;
}

export function ProgramTable({ programs, accounts, onEdit, onDelete }: ProgramTableProps) {
  const isProgramInUse = (id: string) => accounts.some((a) => a.programId === id);

  const renderCycleBadge = (program: Program) => {
    if (!program.passengerCycleType) {
      return <span className="text-muted-foreground text-sm">—</span>;
    }
    return (
      <Badge variant="outline">
        {program.passengerCycleType === "anual"
          ? `Anual — ${program.maxPassengers ?? "?"} pax/ano`
          : `${program.maxPassengers ?? "?"} pax/${program.passengerCycleDays ?? "?"}d`}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Programas de Fidelidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Programa</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Controle</TableHead>
                <TableHead className="hidden md:table-cell text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((program) => {
                const disabled = isProgramInUse(program.id);
                return (
                  <TableRow key={program.id}>
                    <TableCell className="hidden md:table-cell font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {program.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={program.type === "pontos" ? "secondary" : "default"}>
                        {program.type === "pontos" ? "Pontos" : "Milhas"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {renderCycleBadge(program)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-3 min-h-[44px] min-w-[44px]"
                          onClick={() => onEdit(program)}
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
                          title="Excluir programa?"
                          description={
                            disabled
                              ? `Não é possível excluir o programa "${program.name}" pois existem contas vinculadas. Remova as contas primeiro.`
                              : `Tem certeza que deseja excluir o programa "${program.name}"? Esta ação não pode ser desfeita.`
                          }
                          confirmLabel="Excluir programa"
                          onConfirm={() => onDelete(program.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <ProgramMobileList
          programs={programs}
          accounts={accounts}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {programs.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum programa cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
