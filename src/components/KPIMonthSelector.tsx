import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KPIMonthSelectorProps {
  months: { month: string }[];
  selected: string;
  onChange: (month: string) => void;
}

export default function KPIMonthSelector({ months, selected, onChange }: KPIMonthSelectorProps) {
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {months.map((m) => (
          <SelectItem key={m.month} value={m.month}>
            {m.month}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
