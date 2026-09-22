import { parseDateOnly } from "@/lib/dateUtils";

interface EntryRecurrenceSummaryProps {
  recurrenceType: "monthly" | "quarterly" | "semiannual" | "annual";
  recurrenceCount: number;
  startDate: string;
  recurrenceValueMode: "split" | "repeat";
  amountPaid: string;
}

export function EntryRecurrenceSummary({
  recurrenceType,
  recurrenceCount,
  startDate,
  recurrenceValueMode,
  amountPaid,
}: EntryRecurrenceSummaryProps) {
  const recurrenceLabel =
    recurrenceType === "monthly"
      ? "Mensal"
      : recurrenceType === "quarterly"
        ? "Trimestral"
        : recurrenceType === "semiannual"
          ? "Semestral"
          : "Anual";

  const amountPaidNum = parseFloat(amountPaid || "0");
  const valuePerParcel =
    recurrenceValueMode === "split"
      ? (amountPaidNum / (recurrenceCount || 1)).toFixed(2)
      : amountPaidNum.toFixed(2);

  return (
    <div className="border-t pt-4">
      <div className="text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Tipo:</span>
          <span>{recurrenceLabel}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Parcelas:</span>
          <span>{recurrenceCount}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Início:</span>
          <span>{startDate}</span>
        </div>
        <div className="flex justify-between mt-1 text-xs text-primary">
          <span>Dia do mês:</span>
          <span>{startDate ? parseDateOnly(startDate).getDate() + "º dia" : "—"}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Valor por parcela:</span>
          <span>R$ {valuePerParcel}</span>
        </div>
      </div>
    </div>
  );
}
