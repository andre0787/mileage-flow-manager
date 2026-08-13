import { Button } from "@/components/ui/button";

interface DrawerFooterProps {
  isCreating: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function DrawerFooter({ isCreating, onCancel, onSubmit }: DrawerFooterProps) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isCreating}
        className="bg-gradient-primary hover:opacity-90"
      >
        {isCreating ? "Salvando..." : "Cadastrar"}
      </Button>
    </div>
  );
}
