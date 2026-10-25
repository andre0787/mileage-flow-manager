import { useState } from "react";
import { ProgramDialog } from "./ProgramDialog";
import { ProgramTable } from "./ProgramTable";
import type { Program, Account } from "@/types";

interface ProgramSectionProps {
  programs: Program[];
  accounts: Account[];
  onAdd: (data: {
    id: string;
    name: string;
    type: Program["type"];
    maxPassengers?: number;
    passengerCycleType?: "anual" | "dias";
    passengerCycleDays?: number;
  }) => void;
  onUpdate: (data: {
    id: string;
    name: string;
    type: Program["type"];
    maxPassengers?: number;
    passengerCycleType?: "anual" | "dias";
    passengerCycleDays?: number;
  }) => void;
  onDelete: (id: string) => void;
}

export default function ProgramSection({
  programs,
  accounts,
  onAdd,
  onUpdate,
  onDelete,
}: ProgramSectionProps) {
  const [editing, setEditing] = useState<Program | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetDialog = () => {
    setEditing(null);
    setIsDialogOpen(false);
  };

  const handleSave = (data: {
    id?: string;
    name: string;
    type: Program["type"];
    maxPassengers?: number;
    passengerCycleType?: "anual" | "dias";
    passengerCycleDays?: number;
  }) => {
    if (data.id) {
      onUpdate({ id: data.id, ...data });
    } else {
      onAdd({ id: crypto.randomUUID(), ...data });
    }
    resetDialog();
  };

  const handleEdit = (program: Program) => {
    setEditing(program);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">{programs.length} programa(s) cadastrado(s)</p>
        <ProgramDialog
          editing={editing}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          onReset={resetDialog}
        />
      </div>

      <ProgramTable
        programs={programs}
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
