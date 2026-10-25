export interface ProfitPreviewData {
  costTotal: number;
  profit: number;
  margin: number;
}

interface SaleFormProfitPreviewProps {
  profitPreview: ProfitPreviewData | null;
  additionalCostsTotal: number;
}

export function SaleFormProfitPreview({
  profitPreview,
  additionalCostsTotal,
}: SaleFormProfitPreviewProps) {
  if (!profitPreview) return null;

  return (
    <div className="p-3 bg-success-light rounded-lg">
      <h4 className="font-semibold text-sm mb-2">Cálculo de Lucro:</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Custo total:</span>
          <p className="font-semibold">R$ {profitPreview.costTotal.toFixed(2)}</p>
        </div>
        {additionalCostsTotal > 0 && (
          <div>
            <span className="text-muted-foreground">Custos adicionais:</span>
            <p className="font-semibold text-destructive">R$ {additionalCostsTotal.toFixed(2)}</p>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Lucro:</span>
          <p className="font-semibold text-success">R$ {profitPreview.profit.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Margem:</span>
          <p className="font-semibold">{profitPreview.margin.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
