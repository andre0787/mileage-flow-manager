import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ControleCpfFiltersProps {
  programNames: string[];
  owners: string[];
  selectedProgram: string;
  selectedOwner: string;
  onProgramChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
}

export function ControleCpfFilters({
  programNames,
  owners,
  selectedProgram,
  selectedOwner,
  onProgramChange,
  onOwnerChange,
}: ControleCpfFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Programa:</label>
        <Select value={selectedProgram} onValueChange={onProgramChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Programas</SelectItem>
            {programNames.map((program) => (
              <SelectItem key={program} value={program}>
                {program}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Dono:</label>
        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Donos</SelectItem>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
