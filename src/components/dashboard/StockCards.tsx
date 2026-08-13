import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StockCardData {
  label: string;
  value: string;
  iconClass: string;
  accentClass: string;
  rows: { label: string; value: string; rowClass: string; valueClass: string }[];
}

interface StockCardsProps {
  /** Card de Milhas em Estoque */
  milhas: StockCardData;
  /** Card de Pontos em Estoque */
  pontos: StockCardData;
}

function StockCard({ data }: { data: StockCardData }) {
  return (
    <Card className="overflow-hidden transition-card duration-300 hover:shadow-elegant">
      <div
        className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", data.accentClass)}
      />
      <CardContent className="p-5 md:p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn("w-8 h-8 rounded-lg flex items-center justify-center", data.iconClass)}
          >
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-display">{data.label}</h3>
            <p className="text-xs text-muted-foreground">{data.value}</p>
          </div>
        </div>

        <div className="space-y-3">
          {data.rows.map((row) => (
            <div
              key={row.label}
              className={cn("flex items-center justify-between p-2.5 rounded-lg", row.rowClass)}
            >
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className={cn("text-sm font-bold tabular-nums", row.valueClass)}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StockCards({ milhas, pontos }: StockCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StockCard data={milhas} />
      <StockCard data={pontos} />
    </div>
  );
}
