import { SortableHeader } from "@/components/ui/SortableHeader";
import { TableHeader, TableRow, TableHead } from "@/components/ui/table";
import type { SortState } from "@/lib/sort";

interface SaleTableHeaderProps {
  sort: SortState;
  onSort: (sort: SortState) => void;
}

export function SaleTableHeader({ sort, onSort }: SaleTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <SortableHeader label="Data" sortKey="Data" sort={sort} onSort={onSort} />
        <SortableHeader label="Dono" sortKey="Dono" sort={sort} onSort={onSort} />
        <SortableHeader label="Programa" sortKey="Programa" sort={sort} onSort={onSort} />
        <SortableHeader label="Cliente" sortKey="Cliente" sort={sort} onSort={onSort} />
        <SortableHeader
          label="Milhas"
          sortKey="Milhas"
          sort={sort}
          onSort={onSort}
          className="text-right tabular-nums"
        />
        <SortableHeader
          label="Valor"
          sortKey="Valor"
          sort={sort}
          onSort={onSort}
          className="text-right tabular-nums"
        />
        <SortableHeader
          label="Pendente"
          sortKey="Pendente"
          sort={sort}
          onSort={onSort}
          className="text-right tabular-nums"
        />
        <SortableHeader
          label="Lucro"
          sortKey="Lucro"
          sort={sort}
          onSort={onSort}
          className="text-right tabular-nums"
        />
        <SortableHeader
          label="Margem"
          sortKey="Margem"
          sort={sort}
          onSort={onSort}
          className="text-right tabular-nums"
        />
        <SortableHeader label="Status" sortKey="Status" sort={sort} onSort={onSort} />
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
  );
}
