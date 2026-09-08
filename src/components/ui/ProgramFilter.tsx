/**
 * ProgramFilter — Select de filtro por programa (padrão OwnerFilter).
 *
 * Uso:
 *   <ProgramFilter programs={programs} value={programFilter} onChange={setProgramFilter} />
 *
 * value: "todos" | programId
 * ponytail: shadcn/ui select, zero deps extras
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Program } from "@/types";

interface ProgramFilterProps {
  programs: Program[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ALL_PROGRAMS = "todos";

export function ProgramFilter({ programs, value, onChange, className = "" }: ProgramFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label="Filtrar por programa">
        <SelectValue placeholder="Todos os Programas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PROGRAMS}>Todos os Programas</SelectItem>
        {programs.map((program) => (
          <SelectItem key={program.id} value={program.id}>
            {program.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
