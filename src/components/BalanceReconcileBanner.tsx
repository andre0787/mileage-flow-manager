import { useMemo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecalcAccountMutation } from "@/hooks/useDatabase/accounts";
import type { Account } from "@/types";

interface BalanceReconcileBannerProps {
  /** Saldo calculado de entradas - vendas */
  computedTotal: number;
  /** Contas para somar saldos */
  accounts: Account[];
}

/**
 * Balanço de reconciliação — avisa se o saldo calculado (entradas - vendas)
 * diferir da soma dos saldos das contas.
 *
 * ponytail: só aparece se houver discrepância > 1, com botão pra recalcular.
 */
export function BalanceReconcileBanner({ computedTotal, accounts }: BalanceReconcileBannerProps) {
  const accountsTotal = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const diff = Math.abs(computedTotal - accountsTotal);

  if (diff <= 1) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-600 dark:text-amber-400">Discrepância detectada</p>
        <p className="text-muted-foreground mt-0.5">
          Saldo calculado:{" "}
          <span className="tabular-nums font-semibold">
            {computedTotal.toLocaleString("pt-BR")}
          </span>
          {" · "}
          Saldo das contas:{" "}
          <span className="tabular-nums font-semibold">
            {accountsTotal.toLocaleString("pt-BR")}
          </span>
          {" · "}
          Diferença:{" "}
          <span className="tabular-nums font-semibold">{diff.toLocaleString("pt-BR")}</span> milhas
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1">
          Pode ser devido a dados históricos anteriores às correções de saldo.
        </p>
      </div>
      <RecalcButton accounts={accounts} />
    </div>
  );
}

function RecalcButton({ accounts }: { accounts: Account[] }) {
  const { mutate, isPending } = useRecalcAccountMutation();
  const accountIds = useMemo(() => accounts.map((a) => a.id), [accounts]);

  if (accountIds.length === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        // ponytail: cada mutation opera em uma conta diferente (PK), sem race
        for (const id of accountIds) {
          mutate(id);
        }
      }}
      disabled={isPending}
      className="shrink-0 gap-1.5 text-xs"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Recalculando..." : "Recalcular tudo"}
    </Button>
  );
}
