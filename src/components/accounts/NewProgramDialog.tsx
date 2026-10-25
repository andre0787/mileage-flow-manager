import { useState } from "react";
import { FormDrawer } from "@/components/FormDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAddProgramMutation } from "@/hooks/useDatabase";

interface NewProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (id: string) => void;
}

export function NewProgramDialog({ open, onOpenChange, onSuccess }: NewProgramDialogProps) {
  const addProgramM = useAddProgramMutation();
  const [name, setName] = useState("");
  const [type, setType] = useState<"pontos" | "milhas">("milhas");

  const handleSave = () => {
    if (!name.trim()) return;
    const id = crypto.randomUUID();
    addProgramM.mutate(
      { id, name: name.trim(), type },
      { onSuccess: () => onSuccess(id) },
    );
    setName("");
    setType("milhas");
    onOpenChange(false);
  };

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title="Novo Programa">
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do programa"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as "pontos" | "milhas")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pontos">Pontos</SelectItem>
              <SelectItem value="milhas">Milhas</SelectItem>
            </SelectContent>
          </Select>
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
