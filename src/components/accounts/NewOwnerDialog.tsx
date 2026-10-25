import { useState } from "react";
import { FormDrawer } from "@/components/FormDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAddOwnerMutation } from "@/hooks/useDatabase";

interface NewOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
}

export function NewOwnerDialog({ open, onOpenChange, onSuccess }: NewOwnerDialogProps) {
  const addOwnerM = useAddOwnerMutation();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    addOwnerM.mutate(
      { id, name: name.trim(), cpf, phone },
      { onSuccess: () => onSuccess(id) },
    );
    setName("");
    setCpf("");
    setPhone("");
    onOpenChange(false);
  };

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Novo Dono">
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do dono"
          />
        </div>
        <div className="space-y-2">
          <Label>CPF</Label>
          <Input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </FormDrawer>
  );
}
