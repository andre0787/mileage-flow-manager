import { useMemo, useState } from "react";
import { Download, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { useAllClientCreditsQuery } from "@/features/clientes";
import {
  buildCollectionReport,
  collectionCsvRows,
  collectionLineTypeLabel,
} from "@/lib/collections";
import type { CollectionLine, CollectionSale } from "@/lib/collections";
import { downloadCSV } from "@/lib/utils";
import { formatDateBR } from "@/lib/dateUtils";
import { SectionTitle, ReportEmpty } from "./ReportChrome";

/** Crédito em verde, débito em vermelho; movimento nulo fica neutro. */
const lineAmountTone = (line: CollectionLine) =>
  line.type === "sale" || line.effect < 0
    ? "text-destructive"
    : line.effect > 0
      ? "text-success"
      : "text-muted-foreground";

/** Saldo devedor em vermelho, credor em verde, quitado neutro. */
const netTone = (net: number) =>
  net > 0 ? "text-destructive" : net < 0 ? "text-success" : "text-muted-foreground";

/**
 * Extrato integral por cliente com vendas e movimentos do ledger.
 */
export function CollectionSection({ sales: salesProp }: { sales?: CollectionSale[] }) {
  const { sales: allSales, clients, isLoading } = useData();
  const sales = salesProp ?? allSales;
  const creditsQ = useAllClientCreditsQuery();
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const clientNames = new Map(clients.map((client) => [client.id, client.name]));
    return buildCollectionReport(sales, creditsQ.data ?? []).map((row) => ({
      ...row,
      clientName: clientNames.get(row.clientId) ?? row.clientName,
    }));
  }, [sales, creditsQ.data, clients]);
  const totalNet = useMemo(
    () => (creditsQ.isError ? null : rows.reduce((s, r) => s + r.net, 0)),
    [rows, creditsQ.isError],
  );

  if (isLoading || creditsQ.isPending) {
    return <div className="h-32 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SectionTitle icon={HandCoins}>
            {totalNet === null
              ? "Cobrança — Extrato indisponível"
              : `Cobrança — Saldo final: R$ ${totalNet.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </SectionTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={creditsQ.isError || rows.length === 0}
            onClick={() => {
              downloadCSV(
                collectionCsvRows(rows),
                `cobranca-${new Date().toISOString().split("T")[0]}.csv`,
              );
            }}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Histórico completo; filtros de período, dono e programa não se aplicam a esta aba.
        </p>
        {creditsQ.isError ? (
          <ReportEmpty message="Não foi possível carregar o extrato de crédito." />
        ) : rows.length === 0 ? (
          <ReportEmpty message="Nenhuma venda ativa ou movimentação de crédito." />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const open = openId === r.clientId;
              return (
                <div key={r.clientId} className="rounded-lg border border-border">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 p-3 text-left min-h-[44px]"
                    onClick={() => setOpenId(open ? null : r.clientId)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        Vendido R$ {r.totalSold.toLocaleString("pt-BR")} · Recebido/aplicado R${" "}
                        {r.totalReceived.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pendente R$ {r.totalPending.toLocaleString("pt-BR")} · Crédito disponível R${" "}
                        {r.creditBalance.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${netTone(r.net)}`}>
                      {r.net > 0 ? "Devedor" : r.net < 0 ? "Credor" : "Quitado"} · R${" "}
                      {Math.abs(r.net).toLocaleString("pt-BR")}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border px-3 py-2 space-y-1.5">
                      {r.lines.map((l) => (
                        <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate">
                              {formatDateBR(l.date)} · {collectionLineTypeLabel(l)} · {l.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {l.type === "sale"
                                ? `Débito R$ ${l.value.toLocaleString("pt-BR")} · Recebido/aplicado R$ ${l.received.toLocaleString("pt-BR")} · Pendente R$ ${l.pending.toLocaleString("pt-BR")}`
                                : `Efeito no crédito: ${l.effect > 0 ? "+" : "−"}R$ ${Math.abs(l.effect).toLocaleString("pt-BR")}`}
                            </p>
                          </div>
                          <span
                            className={`tabular-nums font-semibold whitespace-nowrap ${lineAmountTone(l)}`}
                          >
                            {l.type === "sale"
                              ? `R$ ${l.value.toLocaleString("pt-BR")}`
                              : `${l.effect > 0 ? "+" : "−"}R$ ${Math.abs(l.effect).toLocaleString("pt-BR")}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
