import { Plus, Calculator, Download } from "lucide-react";
import { SearchInput } from "@/components/ui/SearchInput";
import { OwnerFilter, ProgramFilter } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Owner, Program } from "@/types";

interface VendasHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  programFilter: string;
  onProgramFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  owners: Owner[];
  programs: Program[];
  onExport: () => void;
  onOpenSimulator: () => void;
  onNewSale: () => void;
}

export function VendasHeader({
  searchTerm,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
  programFilter,
  onProgramFilterChange,
  statusFilter,
  onStatusFilterChange,
  owners,
  programs,
  onExport,
  onOpenSimulator,
  onNewSale,
}: VendasHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Vendas de Milhas</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie as vendas de milhas e controle de estoque por dono
        </p>
      </div>
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        <div className="min-w-[200px] flex-1 sm:flex-none">
          <SearchInput placeholder="Buscar venda..." value={searchTerm} onChange={onSearchChange} />
        </div>
        <OwnerFilter
          owners={owners}
          value={ownerFilter}
          onChange={onOwnerFilterChange}
          className="w-full sm:w-44"
        />
        <ProgramFilter
          programs={programs.filter((p) => p.type === "milhas")}
          value={programFilter}
          onChange={onProgramFilterChange}
          className="w-full sm:w-44"
        />
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={onExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none gap-2" onClick={onOpenSimulator}>
            <Calculator className="h-4 w-4" />
            Simular
          </Button>
          <Button
            className="flex-1 sm:flex-none gap-2 bg-gradient-primary hover:opacity-90"
            onClick={onNewSale}
          >
            <Plus className="h-4 w-4" />
            Nova Venda
          </Button>
        </div>
      </div>
    </div>
  );
}
