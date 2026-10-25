export interface SimulationResults {
  saleValue: number;
  totalCost: number;
  profit: number;
  margin: number;
  roi: number;
}

interface SaleSimulationResultProps {
  results: SimulationResults;
  miles: string;
}

export function SaleSimulationResult({ results, miles }: SaleSimulationResultProps) {
  const milesNum = parseFloat(miles) || 0;

  if (results.saleValue > 0) {
    return (
      <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-3 animate-slide-up">
        <h4 className="font-semibold text-sm">Resultado da Simulação:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Valor da Venda:</span>
            <p className="font-bold text-lg">R$ {results.saleValue.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Custo Total:</span>
            <p className="font-semibold">R$ {results.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Lucro:</span>
            <p
              className={`font-bold text-lg ${results.profit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {results.profit >= 0 ? "+" : ""}R$ {results.profit.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Margem:</span>
            <p
              className={`font-bold text-lg ${results.margin >= 0 ? "text-success" : "text-destructive"}`}
            >
              {results.margin.toFixed(1)}%
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">ROI:</span>
            <p
              className={`font-bold text-lg ${results.roi >= 0 ? "text-success" : "text-destructive"}`}
            >
              {results.roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (milesNum > 0 && results.saleValue === 0) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
        Preencha o preço por milha para ver os resultados
      </div>
    );
  }

  return null;
}
