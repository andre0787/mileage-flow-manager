import { formatDateBR } from "@/lib/dateUtils";
import { ownerColor } from "@/lib/ownerColors";
import { TableCell, TableRow } from "@/components/ui/table";
import { EntryBadges } from "@/components/entry/EntryBadges";
import { EntryActions } from "@/components/entry/EntryActions";
import type { PointEntry, Account, OrigemType } from "@/types";

export interface EntryTableRowProps {
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

export function EntryTableRow({
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
