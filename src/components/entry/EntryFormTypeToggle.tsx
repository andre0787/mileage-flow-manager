import { Button } from "@/components/ui/button";

interface EntryFormTypeToggleProps {
  formType: "pontos" | "milhas";
  onSwitchFormType: (next: "pontos" | "milhas") => void;
}

export function EntryFormTypeToggle({ formType, onSwitchFormType }: EntryFormTypeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Tipo do registro:</span>
      <div className="flex gap-1.5">
        {(["pontos", "milhas"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            variant={formType === t ? "default" : "outline"}
            size="sm"
            className="min-h-[36px]"
            onClick={() => onSwitchFormType(t)}
          >
            {t === "pontos" ? "Pontos" : "Milhas"}
          </Button>
        ))}
      </div>
    </div>
  );
}
