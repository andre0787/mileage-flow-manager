import { Button } from "@/components/ui/button";
import type { SaleKind } from "@/types";

interface SaleFormKindToggleProps {
  kind: SaleKind;
  mode: "create" | "edit";
  onSwitchKind: (kind: SaleKind) => void;
}

export function SaleFormKindToggle({ kind, mode, onSwitchKind }: SaleFormKindToggleProps) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Tipo da venda">
      {(
        [
          { value: "milhas", label: "Milhas" },
          { value: "servico", label: "Serviço" },
        ] as const
      ).map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={kind === opt.value ? "default" : "outline"}
          className="min-h-[44px]"
          disabled={mode === "edit"}
          title={mode === "edit" ? "Tipo da venda não pode ser alterado" : undefined}
          onClick={() => onSwitchKind(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
