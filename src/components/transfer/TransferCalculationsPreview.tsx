import type { computeTransferCalc } from "@/lib/transferCalc";

interface TransferCalculationsPreviewProps {
  amount: string;
  amountPaid: string;
  calc: ReturnType<typeof computeTransferCalc>;
  effectiveMiles: number;
  amountNum: number;
  bonusNum: number;
  cartAmountNum: number;
  cartCostNum: number;
}

export function TransferCalculationsPreview({
  amount,
  amountPaid,
  calc,
  effectiveMiles,
  amountNum,
  bonusNum,
  cartAmountNum,
  cartCostNum,
}: TransferCalculationsPreviewProps) {
  if (!amount) return null;

  return (
    <div className="p-4 bg-gradient-success/10 border border-success/20 rounded-lg space-y-2 animate-slide-up">
      <h4 className="font-semibold text-sm">Cálculos Automáticos:</h4>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Custo por milhar:</span>
          <p className="font-semibold">R$ {calc.costPerThousand.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Milhas recebidas:</span>
          <p className="font-semibold text-success">{effectiveMiles.toLocaleString("pt-BR")}</p>
          {cartAmountNum > 0 && (
            <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
              <p>
                Da transferência:{" "}
                {(amountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p>
                Do carrinho:{" "}
                {(cartAmountNum * (1 + bonusNum / 100)).toLocaleString("pt-BR", {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Custo por milha:</span>
          <p className="font-semibold">R$ {calc.costPerMile.toFixed(4)}</p>
          {cartAmountNum > 0 && (
            <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground border-t border-success/20 pt-1">
              <p>Transferência: R$ {parseFloat(amountPaid || "0").toFixed(2)}</p>
              <p>Carrinho: R$ {cartCostNum.toFixed(2)}</p>
              <p className="font-semibold text-foreground">
                Total: R$ {calc.totalPaid.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
