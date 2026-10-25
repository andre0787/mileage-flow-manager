import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ownerColor, isValidHex } from "@/lib/ownerColors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCPF } from "@/lib/utils";
import { OwnerColorPicker } from "./OwnerColorPicker";
import type { Owner } from "@/types";

export interface OwnerFormData {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  color: string | null;
}

interface OwnerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingOwner: Owner | null;
  onAdd: (data: OwnerFormData) => void;
  onUpdate: (data: OwnerFormData) => void;
  onClose: () => void;
}

export function OwnerDialog({
  isOpen,
  onOpenChange,
  editingOwner,
  onAdd,
  onUpdate,
  onClose,
}: OwnerDialogProps) {
  const [newOwner, setNewOwner] = useState({
    name: "",
    cpf: "",
    phone: "",
    color: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingOwner) {
      setNewOwner({
        name: editingOwner.name,
        cpf: editingOwner.cpf ?? "",
        phone: editingOwner.phone ?? "",
        color: isValidHex(editingOwner.color) ? editingOwner.color : ownerColor(editingOwner.name),
      });
    } else {
      setNewOwner({ name: "", cpf: "", phone: "", color: "" });
    }
    setError("");
  }, [editingOwner, isOpen]);

  const handleSave = () => {
    if (!newOwner.name) {
      setError("Nome é obrigatório");
      return;
    }
    const color = isValidHex(newOwner.color) ? newOwner.color.trim() : null;
    if (editingOwner) {
      onUpdate({ id: editingOwner.id, ...newOwner, color });
    } else {
      onAdd({ id: crypto.randomUUID(), ...newOwner, color });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Novo Dono
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingOwner ? "Editar Dono" : "Novo Dono"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Nome Completo</Label>
            <Input
              id="ownerName"
              value={newOwner.name}
              onChange={(e) => {
                setNewOwner({ ...newOwner, name: e.target.value });
                setError("");
              }}
              placeholder="Nome do dono"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerCpf">CPF</Label>
            <Input
              id="ownerCpf"
              value={newOwner.cpf}
              onChange={(e) => setNewOwner({ ...newOwner, cpf: formatCPF(e.target.value) })}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerPhone">Telefone</Label>
            <Input
              id="ownerPhone"
              value={newOwner.phone}
              onChange={(e) => setNewOwner({ ...newOwner, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <OwnerColorPicker
            color={newOwner.color}
            ownerName={newOwner.name}
            onChangeColor={(color) => setNewOwner({ ...newOwner, color })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary hover:opacity-90">
            {editingOwner ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
