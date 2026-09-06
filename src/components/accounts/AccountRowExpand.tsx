import { formatDateBR } from "@/lib/dateUtils";

interface AccountRowExpandProps {
  colSpan: number;
  averageCostPerMile?: number | null;
  lastEntryDate?: string;
  lastSaleDate?: string;
  ownerName: string;
  programName: string;
}

/** Linha expansível da tabela: mesmos dados de detalhe do card. */
export function AccountRowExpand({
  colSpan,
  averageCostPerMile,
  lastEntryDate,
  lastSaleDate,
  ownerName,
  programName,
}: AccountRowExpandProps) {
  const rows: [string, string][] = [
    ["Dono", ownerName],
    ["Programa", programName],
    ["Custo/milha", averageCostPerMile != null ? `R$ ${averageCostPerMile.toFixed(4)}` : "—"],
    ["Última entrada", lastEntryDate ? formatDateBR(lastEntryDate) : "—"],
    ["Última venda", lastSaleDate ? formatDateBR(lastSaleDate) : "—"],
  ];
  return (
    <tr className="bg-muted/30 hover:bg-muted/30">
      <td colSpan={colSpan} className="px-4 py-2">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{label}:</dt>
              <dd className="font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </td>
    </tr>
  );
}
