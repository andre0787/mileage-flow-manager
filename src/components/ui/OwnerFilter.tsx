/**
 * OwnerFilter — Select de filtro por dono (padrão Dashboard/Relatórios).
 *
 * Uso:
 *   <OwnerFilter owners={owners} value={ownerFilter} onChange={setOwnerFilter} />
 *
 * value: "todos" | ownerId
 * ponytail: shadcn/ui select, zero deps extras
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Owner } from "@/types";

interface OwnerFilterProps {
  owners: Owner[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ALL_OWNERS = "todos";

export function OwnerFilter({ owners, value, onChange, className = "" }: OwnerFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label="Filtrar por dono">
        <SelectValue placeholder="Todos os Donos" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_OWNERS}>Todos os Donos</SelectItem>
        {owners.map((owner) => (
          <SelectItem key={owner.id} value={owner.id}>
            {owner.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
