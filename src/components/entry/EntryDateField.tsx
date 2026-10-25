import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EntryDateFieldProps {
  date: string;
  error?: string;
  onChange: (value: string) => void;
}

export function EntryDateField({ date, error, onChange }: EntryDateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="entryDate">Data</Label>
      <Input
        id="entryDate"
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
