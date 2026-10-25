import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/FormSubmitButton";

interface EntryFormActionsProps {
  mode: "create" | "edit";
  onCancel: () => void;
}

export function EntryFormActions({ mode, onCancel }: EntryFormActionsProps) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <FormSubmitButton className="bg-gradient-primary hover:opacity-90">
        {mode === "create" ? "Registrar Entrada" : "Salvar Alterações"}
      </FormSubmitButton>
    </div>
  );
}
