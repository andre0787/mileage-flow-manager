interface EntryCalculationsCardProps {
  formType: "pontos" | "milhas";
  amount: string;
  amountPaid: string;
  conversionRate: string;
}

export function EntryCalculationsCard({
  formType,
  amount,
  amountPaid,
  conversionRate,
}: EntryCalculationsCardProps) {
  if (!amount || !amountPaid) return null;

  const amountNum = parseFloat(amount || "0");
  const amountPaidNum = parseFloat(amountPaid || "0");
  const milesGenerated = amountNum * parseFloat(conversionRate || "1");
  const costPerMile = amountPaidNum / (milesGenerated || 1);
  const costPerThousand = amountNum > 0 ? (amountPaidNum / amountNum) * 1000 : 0;

  return (
    <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
      <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
      <div
        className={
          formType === "pontos"
            ? "grid grid-cols-3 gap-4 text-xs"
            : "grid grid-cols-2 gap-4 text-xs"
        }
      >
        <div>
          <span className="text-muted-foreground">Custo por milhar:</span>
          <p className="font-semibold">R$ {costPerThousand.toFixed(2)}</p>
        </div>
        {formType === "pontos" && (
          <div>
            <span className="text-muted-foreground">Milhas geradas:</span>
            <p className="font-semibold">{milesGenerated.toLocaleString("pt-BR")}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Custo por milha:</span>
          <p className="font-semibold">R$ {costPerMile.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}
