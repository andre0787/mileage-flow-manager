import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProgramFormFields, type ProgramFormData } from "./ProgramFormFields";
import type { Program } from "@/types";

interface ProgramDialogProps {
  editing: Program | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id?: string;
    name: string;
    type: Program["type"];
    maxPassengers?: number;
    passengerCycleType?: "anual" | "dias";
    passengerCycleDays?: number;
  }) => void;
  onReset: () => void;
}

const initialFormState: ProgramFormData = {
  name: "",
  type: "milhas",
  maxPassengers: "",
  passengerCycleType: "none",
  passengerCycleDays: "",
};

export function ProgramDialog({
  editing,
  isOpen,
  onOpenChange,
  onSave,
  onReset,
}: ProgramDialogProps) {
  const [form, setForm] = useState<ProgramFormData>(initialFormState);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        maxPassengers: editing.maxPassengers?.toString() ?? "",
        passengerCycleType: editing.passengerCycleType ?? "none",
        passengerCycleDays: editing.passengerCycleDays?.toString() ?? "",
      });
      setError("");
    } else if (!isOpen) {
      setForm(initialFormState);
      setError("");
    }
  }, [editing, isOpen]);

  const handleSave = () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    if (form.passengerCycleType !== "none" && !form.maxPassengers) {
      setError("Máx. Passageiros é obrigatório para controle ativo");
      return;
    }
    if (form.passengerCycleType === "dias" && !form.passengerCycleDays) {
      setError("Janela em dias é obrigatória para ciclo por dias");
      return;
    }

    onSave({
      id: editing?.id,
      name: form.name.trim(),
      type: form.type,
      maxPassengers:
        form.passengerCycleType !== "none" && form.maxPassengers
          ? parseInt(form.maxPassengers)
          : undefined,
      passengerCycleType: form.passengerCycleType !== "none" ? form.passengerCycleType : undefined,
      passengerCycleDays:
        form.passengerCycleType === "dias" && form.passengerCycleDays
          ? parseInt(form.passengerCycleDays)
          : undefined,
    });
  };

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      onReset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
          onClick={() => {
            onReset();
            setForm(initialFormState);
            setError("");
          }}
        >
          <Plus className="h-4 w-4" /> Novo Programa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Programa" : "Novo Programa"}</DialogTitle>
        </DialogHeader>
        <ProgramFormFields
          form={form}
          error={error}
          onChange={setForm}
          onErrorClear={() => setError("")}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            {editing ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
