import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDrawer } from "@/components/FormDrawer";
import { DrawerFooter } from "@/components/entry/DrawerFooter";

interface EntryOrigemTypeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "milhas" | "pontos";
  onCreated: (id: string) => void;
  onCreate?: (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
  }) => Promise<string | undefined>;
}

export function EntryOrigemTypeDrawer({
  open,
  onOpenChange,
  type,
  onCreated,
  onCreate,
}: EntryOrigemTypeDrawerProps) {
  const [newOT, setNewOT] = useState({ name: "", color: "#10b981", hasRecurrence: false });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const handleCreate = async () => {
    const errs: typeof errors = {};
    if (!newOT.name.trim()) errs.name = "Nome é obrigatório";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsCreating(true);
    try {
      const id = await onCreate?.({
        name: newOT.name.trim(),
        color: newOT.color,
        hasRecurrence: newOT.hasRecurrence,
      });
      if (id) onCreated(id);
      setNewOT({ name: "", color: "#10b981", hasRecurrence: false });
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
      title="Novo Tipo de Origem"
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={newOT.name}
            onChange={(e) => {
              setNewOT((p) => ({ ...p, name: e.target.value }));
              setErrors((p) => ({ ...p, name: "" }));
            }}
            placeholder={`Ex: ${type === "milhas" ? "Compra Direta" : "Cashback"}`}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: newOT.color }} />
            <Input
              type="color"
              value={newOT.color}
              onChange={(e) => setNewOT((p) => ({ ...p, color: e.target.value }))}
              className="w-full h-10 p-1"
            />
          </div>
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
