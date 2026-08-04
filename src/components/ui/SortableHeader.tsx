/**
 * SortableHeader — TableHead clicável com indicador de ordenação.
 *
 * Uso:
 *   <SortableHeader label="Data" sortKey="Data" sort={sort} onSort={setSort} />
 *
 * ponytail: lucide + sort lib, zero deps extras
 */

import { ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { toggleSort, type SortState } from "@/lib/sort";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortState;
  onSort: (next: SortState) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className = "",
}: SortableHeaderProps) {
  return (
    <TableHead
      className={`cursor-pointer select-none ${className}`}
      onClick={() => onSort(toggleSort(sort, sortKey))}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sort.key === sortKey &&
          (sort.dir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          ))}
      </span>
    </TableHead>
  );
}
