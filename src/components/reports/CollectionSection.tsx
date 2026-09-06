import { useMemo, useState } from "react";
import { Download, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { useAllClientCreditsQuery } from "@/features/clientes";
import { buildCollectionReport, collectionCsvRows } from "@/lib/collections";
import { downloadCSV } from "@/lib/utils";
import { formatDateBR } from "@/lib/dateUtils";

/** Seção Cobrança: débitos por cliente p/ cobrança — sem lucro/margem/custos. */
export function CollectionSection() {
  const { sales, isLoading } = useData();
  const creditsQ = useAllClientCreditsQuery();
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(
    () => buildCollectionReport(sales, creditsQ.data ?? []),
    [sales, creditsQ.data],
  );
  const totalNet = useMemo(() => rows.reduce((s, r) => s + r.net, 0), [rows]);

  if (isLoading || creditsQ.isPending) {
    return <div className="h-32 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 border-l-4 border-primary pl-3">
            <HandCoins className="h-5 w-5 text-primary" />
            Cobrança — Líquido: R$ {totalNet.toLocaleString("pt-BR")}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={rows.length === 0}
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
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum débito em aberto. Tudo recebido.
          </p>
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
                        Pendente R$ {r.totalPending.toLocaleString("pt-BR")}
                        {r.creditBalance > 0 &&
                          ` · Crédito R$ ${r.creditBalance.toLocaleString("pt-BR")}`}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">
                      R$ {r.net.toLocaleString("pt-BR")}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-border px-3 py-2 space-y-1.5">
                      {r.lines.map((l) => (
                        <div
                          key={l.saleId}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate">
                              {formatDateBR(l.date)} · {l.kind === "servico" ? "Serviço" : "Milhas"}{" "}
                              · {l.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Valor R$ {l.value.toLocaleString("pt-BR")} · Recebido R${" "}
                              {l.received.toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <span className="tabular-nums font-semibold whitespace-nowrap">
                            R$ {l.pending.toLocaleString("pt-BR")}
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
