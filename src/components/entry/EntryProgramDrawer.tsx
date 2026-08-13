import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDrawer } from "@/components/FormDrawer";
import { DrawerFooter } from "@/components/entry/DrawerFooter";

interface EntryProgramDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
  onCreate?: (data: { name: string; type: "pontos" | "milhas" }) => Promise<string | undefined>;
}

export function EntryProgramDrawer({
  open,
  onOpenChange,
  onCreated,
  onCreate,
}: EntryProgramDrawerProps) {
  const [newProgram, setNewProgram] = useState<{ name: string; type: "pontos" | "milhas" }>({
    name: "",
    type: "pontos",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!newProgram.name.trim()) errs.name = "Nome é obrigatório";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsCreating(true);
    try {
      const id = await onCreate?.({
        name: newProgram.name.trim(),
        type: newProgram.type,
      });
      if (id) onCreated(id);
      setNewProgram({ name: "", type: "pontos" });
      setErrors({});
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setErrors({});
      }}
      title="Novo Programa"
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={newProgram.name}
            onChange={(e) => {
              setNewProgram((p) => ({ ...p, name: e.target.value }));
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="Ex: LATAM Pass"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={newProgram.type}
            onValueChange={(v) => setNewProgram((p) => ({ ...p, type: v as "pontos" | "milhas" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pontos">Pontos</SelectItem>
              <SelectItem value="milhas">Milhas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DrawerFooter
        isCreating={isCreating}
        onCancel={() => onOpenChange(false)}
        onSubmit={handleCreate}
      />
    </FormDrawer>
  );
}
