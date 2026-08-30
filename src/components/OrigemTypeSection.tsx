import { useState } from "react";
import { filterToCleanOrigemTypes } from "@/lib/origemTypes";
import { isTransferencia } from "@/lib/utils";
import { OrigemTypeDialog } from "./OrigemTypeDialog";
import { OrigemTypeTable } from "./OrigemTypeTable";
import type { OrigemType, PointEntry } from "@/types";

interface OrigemTypeSectionProps {
  origemTypes: OrigemType[];
  entries: PointEntry[];
  onAdd: (data: {
    id: string;
    name: string;
    accountType: OrigemType["accountType"];
    color: string;
    description: string | undefined;
  }) => void;
  onUpdate: (data: {
    id: string;
    name: string;
    accountType: OrigemType["accountType"];
    color: string;
    description: string | undefined;
  }) => void;
  onDelete: (id: string) => void;
}

export default function OrigemTypeSection({
  origemTypes,
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: OrigemTypeSectionProps) {
  const milhasTypes = filterToCleanOrigemTypes(
    origemTypes.filter((ot) => ot.accountType === "milhas" && !isTransferencia(ot)),
  );
  const [editing, setEditing] = useState<OrigemType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetDialog = () => {
    setEditing(null);
    setIsDialogOpen(false);
  };

  const handleSave = (data: {
    id?: string;
    name: string;
    accountType: OrigemType["accountType"];
    color: string;
    description: string | undefined;
  }) => {
    if (data.id) {
      onUpdate({ id: data.id, ...data });
    } else {
      onAdd({ id: crypto.randomUUID(), ...data });
    }
    resetDialog();
  };

  const handleEdit = (ot: OrigemType) => {
    setEditing(ot);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {milhasTypes.length} tipo(s) de operação cadastrado(s)
        </p>
        <OrigemTypeDialog
          editing={editing}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          onReset={resetDialog}
        />
      </div>

      <OrigemTypeTable
        milhasTypes={milhasTypes}
        entries={entries}
        onEdit={handleEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
