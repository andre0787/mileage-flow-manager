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
import type { Account, Owner } from "@/types";

interface EntryAccountSelectProps {
  accountId: string;
  availableAccounts: Account[];
  owners: Owner[];
  mode: "create" | "edit";
  error?: string;
  onCreateAccount?: (data: { name: string; ownerId: string; programId: string }) => Promise<string | undefined>;
  onSelectAccount: (value: string) => void;
  onOpenAccountDrawer: () => void;
}

export function EntryAccountSelect({
  accountId,
  availableAccounts,
  owners,
  mode,
  error,
  onCreateAccount,
  onSelectAccount,
  onOpenAccountDrawer,
}: EntryAccountSelectProps) {
  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="space-y-2">
      <Label htmlFor="entryAccount">Conta</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={accountId} onValueChange={onSelectAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {availableAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} ({ownerName(acc.ownerId)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mode === "create" && onCreateAccount && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Adicionar conta"
            type="button"
            onClick={onOpenAccountDrawer}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
