import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PointEntry, OrigemType } from "@/types";

export interface EntryBadgesProps {
  entry: PointEntry;
  isPontos: boolean;
  origemTypes: OrigemType[];
  origemName: string;
}

export function EntryBadges({ entry, isPontos, origemTypes, origemName }: EntryBadgesProps) {
  const color = origemTypes.find((ot) => ot.id === entry.origemTypeId)?.color;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="outline" className="gap-1">
        {isPontos && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
        {origemName}
      </Badge>
      {entry.cartAmount && entry.cartAmount > 0 ? (
        <Badge variant="secondary" className="text-[10px] h-5 gap-1">
          🛒 Carrinho
        </Badge>
      ) : null}
      {entry.recurrenceInterval && entry.entryStatus !== "aguardando" ? (
        <Badge
          variant="secondary"
          className="text-[10px] h-5 gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
        >
          🔄 Clube
        </Badge>
      ) : null}
      {entry.entryStatus === "aguardando" && <StatusBadge status="aguardando" size="sm" />}
    </div>
  );
}
