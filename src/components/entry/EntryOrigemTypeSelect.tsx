import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrigemType } from "@/types";

interface EntryOrigemTypeSelectProps {
  origemTypeId: string;
  currentOrigemTypes: OrigemType[];
  mode: "create" | "edit";
  error?: string;
  onCreateOrigemType?: (data: {
    name: string;
    color: string;
    hasRecurrence: boolean;
    accountType?: "pontos" | "milhas";
  }) => Promise<string | undefined>;
  onOrigemTypeChange: (value: string) => void;
  onOpenOrigemTypeDrawer: () => void;
}

export function EntryOrigemTypeSelect({
  origemTypeId,
  currentOrigemTypes,
  mode,
  error,
  onCreateOrigemType,
  onOrigemTypeChange,
  onOpenOrigemTypeDrawer,
}: EntryOrigemTypeSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="entryType">Tipo de Origem</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={origemTypeId} onValueChange={onOrigemTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {currentOrigemTypes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === "create" && onCreateOrigemType && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Adicionar tipo de origem"
            type="button"
            onClick={onOpenOrigemTypeDrawer}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
