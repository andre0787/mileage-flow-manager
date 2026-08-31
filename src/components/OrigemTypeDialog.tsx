import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseOrigemTypeDescription, serializeOrigemTypeDescription } from "@/lib/origemTypes";
import type { OrigemType } from "@/types";

interface OrigemTypeDialogProps {
  editing: OrigemType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id?: string;
    name: string;
    accountType: OrigemType["accountType"];
    color: string;
    description: string | undefined;
  }) => void;
  onReset: () => void;
}

export function OrigemTypeDialog({
  editing,
  isOpen,
  onOpenChange,
  onSave,
  onReset,
}: OrigemTypeDialogProps) {
  const [form, setForm] = useState({
    name: "",
    accountType: "milhas" as OrigemType["accountType"],
    color: "#10b981",
    hasRecurrence: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        accountType: editing.accountType,
        color: editing.color,
        hasRecurrence: parseOrigemTypeDescription(editing.description).hasRecurrence,
      });
      setError("");
    } else if (!isOpen) {
      setForm({ name: "", accountType: "milhas", color: "#10b981", hasRecurrence: false });
      setError("");
    }
  }, [editing, isOpen]);

  const handleSave = () => {
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    const description = serializeOrigemTypeDescription(form.hasRecurrence);
    onSave({
      id: editing?.id,
      name: form.name.trim(),
      accountType: form.accountType,
      color: form.color,
      description,
    });
  };

  const handleDialogChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      onReset();
    } else if (!editing) {
      setForm({ name: "", accountType: "milhas", color: "#10b981", hasRecurrence: false });
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
          onClick={() => {
            onReset();
            setForm({ name: "", accountType: "milhas", color: "#10b981", hasRecurrence: false });
            setError("");
          }}
        >
          <Plus className="h-4 w-4" /> Nova Operação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Operação" : "Nova Operação"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="otName">Nome</Label>
            <Input
              id="otName"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setError("");
              }}
              placeholder="Ex: Compra Direta"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="otColor">Cor</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="otColor"
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 p-1"
              />
              <span className="text-sm text-muted-foreground">{form.color}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="otRecurrence">Recorrência</Label>
            <Select
              value={form.hasRecurrence ? "sim" : "nao"}
              onValueChange={(value) => setForm({ ...form, hasRecurrence: value === "sim" })}
            >
              <SelectTrigger id="otRecurrence">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não recorrente</SelectItem>
                <SelectItem value="sim">Recorrente mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
