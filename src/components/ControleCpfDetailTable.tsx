import { useMemo } from "react";
import { Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProgramOwnerUsage } from "@/hooks/useClientCycleAvailability";
import { formatDateBR } from "@/lib/dateUtils";

interface PassengerRow {
  clientId: string;
  name: string;
  cpf: string;
  lastSaleDate: string;
  programName: string;
  ownerName: string;
  cycleLabel: string;
  emissionCount: number;
}

interface ControleCpfDetailTableProps {
  entries: ProgramOwnerUsage[];
  duplicateCounts: Map<string, number>;
}

function EmissionBadge({ count }: { count: number }) {
  if (count <= 1) return <span className="text-sm text-muted-foreground">1</span>;
  return <Badge variant="secondary">{count} emissões</Badge>;
}

export function ControleCpfDetailTable({ entries, duplicateCounts }: ControleCpfDetailTableProps) {
  const rows: PassengerRow[] = useMemo(
    () =>
      entries.flatMap((u) =>
        u.clients.map((c) => ({
          ...c,
          programName: u.programName,
          ownerName: u.ownerName,
          cycleLabel: u.cycleLabel,
          emissionCount: duplicateCounts.get(c.clientId) ?? 1,
        })),
      ),
    [entries, duplicateCounts],
  );

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Detalhamento por Passageiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">Passageiro</TableHead>
                    <TableHead className="hidden md:table-cell">CPF</TableHead>
                    <TableHead className="hidden md:table-cell">Dono</TableHead>
                    <TableHead className="hidden md:table-cell">Programa</TableHead>
                    <TableHead className="hidden md:table-cell">Ciclo</TableHead>
                    <TableHead className="hidden md:table-cell">Último Uso</TableHead>
                    <TableHead className="hidden md:table-cell">Emissões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="hidden md:table-cell font-medium">{row.name}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono">{row.cpf}</TableCell>
                      <TableCell className="hidden md:table-cell">{row.ownerName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{row.programName}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {row.cycleLabel}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDateBR(row.lastSaleDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <EmissionBadge count={row.emissionCount} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3 mt-4">
              {rows.map((row, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{row.cpf}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {row.programName}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Dono</span>
                      <p className="truncate">{row.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Ciclo</span>
                      <p className="truncate">{row.cycleLabel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Último Uso</span>
                      <p>{formatDateBR(row.lastSaleDate)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Emissões</span>
                      <p>
                        <EmissionBadge count={row.emissionCount} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum registro encontrado para os filtros selecionados
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
