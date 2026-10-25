import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ownerColor } from "@/lib/ownerColors";

interface OwnerColorPickerProps {
  color: string;
  ownerName: string;
  onChangeColor: (color: string) => void;
}

export function OwnerColorPicker({ color, ownerName, onChangeColor }: OwnerColorPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Cor de identificação</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Cor do dono"
          value={color || "#4361EE"}
          onChange={(e) => onChangeColor(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-1"
        />
        <span
          className="h-8 w-8 rounded-full border"
          style={{
            backgroundColor: color || ownerColor(ownerName),
          }}
          aria-hidden
        />
        <span className="text-xs text-muted-foreground">
          Cor usada nas contas, entradas e vendas deste dono.
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => onChangeColor("")}
      >
        <RotateCcw className="h-3 w-3" />
        Usar cor automática (por nome)
      </Button>
    </div>
  );
}
