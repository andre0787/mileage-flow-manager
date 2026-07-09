import { Package, CheckCircle2 } from "lucide-react";
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
import { EmptyState } from "@/components/EmptyState";
import { DeleteEntryDialog } from "@/components/DeleteEntryDialog";
import type { PointEntry, Account, OrigemType, Program, Owner } from "@/types";

interface EntryTableProps {
  type: "pontos" | "milhas";
  entries: PointEntry[];
  accounts: Account[];
  origemTypes: OrigemType[];
  programs: Program[];
  owners: Owner[];
  onEdit: (entry: PointEntry) => void;
  onConfirm: (entry: PointEntry) => void;
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
}: EntryTableProps) {
  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;
  const origemTypeName = (id: string) => {
    const ot = origemTypes.find((ot) => ot.id === id);
    if (ot) return ot.name;
    const prog = programs.find((p) => p.id === id);
    return prog?.name ?? id;
  };
  const isPontos = type === "pontos";

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
    : ["Data", "Conta", "Origem", "Milhas Geradas", "Valor Pago", "Custo/Milha", "Ações"];

  const renderBadges = (entry: PointEntry) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="outline" className="gap-1">
        {isPontos && (
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: origemTypes.find((ot) => ot.id === entry.origemTypeId)?.color,
            }}
          />
        )}
        {origemTypeName(entry.origemTypeId)}
      </Badge>
      {entry.cartAmount && entry.cartAmount > 0 && (
        <Badge variant="secondary" className="text-[10px] h-5 gap-1">
          🛒 Carrinho
        </Badge>
      )}
      {entry.recurrenceInterval && entry.entryStatus !== "aguardando" && (
        <Badge
          variant="secondary"
          className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          🔄 Clube
        </Badge>
      )}
      {entry.entryStatus === "aguardando" && (
        <Badge
          variant="secondary"
          className="text-[10px] h-5 gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          ⏳ Aguardando
        </Badge>
      )}
    </div>
  );

  const renderActions = (entry: PointEntry) => (
    <div className="flex gap-2 justify-end">
      {entry.entryStatus === "aguardando" && (
        <Button
          size="sm"
          variant="outline"
          className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700"
          onClick={() => onConfirm(entry)}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
  );

  const renderMobileCard = (entry: PointEntry) => (
    <div key={entry.id} className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="font-medium">{origemTypeName(entry.origemTypeId)}</p>
            {entry.cartAmount && entry.cartAmount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                🛒 Carrinho
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.date).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Badge variant="outline">{accounts.find((a) => a.id === entry.accountId)?.name}</Badge>
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
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] gap-1"
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
          <p className="font-semibold">R$ {entry.costPerMile.toFixed(4)}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {entry.entryStatus === "aguardando" && (
          <Button
            size="sm"
            variant="outline"
            className="px-3 min-h-[44px] gap-1 border-blue-300 dark:border-blue-700"
            onClick={() => onConfirm(entry)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {desktopColumns.map((col) => (
                <TableHead
                  key={col}
                  className={col === "Ações" ? "text-right" : "hidden md:table-cell"}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={desktopColumns.length} className="py-12">
                  <EmptyState
                    icon={Package}
                    title={`Nenhuma entrada de ${type === "pontos" ? "pontos" : "milhas"}`}
                    description={`Registre sua primeira aquisição de ${type === "pontos" ? "pontos" : "milhas"} ou use a busca para filtrar.`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="hidden md:table-cell">
                    {new Date(entry.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium">
                      {accounts.find((a) => a.id === entry.accountId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ownerName(accounts.find((a) => a.id === entry.accountId)?.ownerId ?? "")}
                    </p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{renderBadges(entry)}</TableCell>
                  {isPontos ? (
                    <>
                      <TableCell className="hidden md:table-cell">
                        {entry.amount.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {entry.amountPaid.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry.conversionRate ?? "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-semibold text-success">
                        {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="hidden md:table-cell">
                        {(entry.milesGenerated ?? entry.amount).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        R$ {entry.amountPaid.toLocaleString("pt-BR")}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="hidden md:table-cell">
                    R$ {entry.costPerMile.toFixed(4)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {renderActions(entry)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 mt-4">
        {entries.length === 0 ? (
          <EmptyState
            icon={Package}
            title={`Nenhuma entrada de ${type === "pontos" ? "pontos" : "milhas"}`}
            description={`Registre sua primeira aquisição de ${type === "pontos" ? "pontos" : "milhas"} ou use a busca para filtrar.`}
          />
        ) : (
          entries.map(renderMobileCard)
        )}
      </div>
    </>
  );
}
