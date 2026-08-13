import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import { DrawerFooter } from "@/components/entry/DrawerFooter";

interface EntryOwnerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
  onCreate?: (data: { name: string; cpf?: string; phone?: string }) => Promise<string | undefined>;
}

export function EntryOwnerDrawer({
  open,
  onOpenChange,
  onCreated,
  onCreate,
}: EntryOwnerDrawerProps) {
  const [newOwner, setNewOwner] = useState({ name: "", cpf: "", phone: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const errs: Record<string, string> = {};
    if (!newOwner.name.trim()) errs.name = "Nome é obrigatório";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsCreating(true);
    try {
      const id = await onCreate?.({
        name: newOwner.name.trim(),
        cpf: newOwner.cpf.trim() || undefined,
        phone: newOwner.phone.trim() || undefined,
      });
      if (id) onCreated(id);
      setNewOwner({ name: "", cpf: "", phone: "" });
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
      title="Novo Dono"
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={newOwner.name}
            onChange={(e) => {
              setNewOwner((p) => ({ ...p, name: e.target.value }));
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder="Ex: João Silva"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label>CPF (opcional)</Label>
          <Input
            value={newOwner.cpf}
            onChange={(e) => setNewOwner((p) => ({ ...p, cpf: e.target.value }))}
            placeholder="000.000.000-00"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone (opcional)</Label>
          <Input
            value={newOwner.phone}
            onChange={(e) => setNewOwner((p) => ({ ...p, phone: e.target.value }))}
            placeholder="(11) 99999-8888"
          />
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
