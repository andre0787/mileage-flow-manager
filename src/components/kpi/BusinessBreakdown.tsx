import { Card, CardContent } from "@/components/ui/card";
import { ownerColor } from "@/lib/ownerColors";
import type { OwnerBreakdown, ProgramBreakdown } from "@/lib/businessSeries";

interface BusinessBreakdownProps {
  owners: OwnerBreakdown[];
  programs: ProgramBreakdown[];
  /** Mapa nome do dono → cor customizada (hex) ou null (fallback por hash). */
  ownerColorsByName?: Record<string, string | null>;
}

function Bar({
  value,
  max,
  colorClass,
  style,
}: {
  value: number;
  max: number;
  colorClass?: string;
  style?: React.CSSProperties;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full ${colorClass ?? ""}`}
        style={{ ...style, width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * BusinessBreakdown — alocação por dono e por programa (estoque/investido).
 * Complementa o BusinessPanel com a visão "quem/quem guarda as milhas".
 */
export function BusinessBreakdown({ owners, programs, ownerColorsByName }: BusinessBreakdownProps) {
  const maxOwnerMiles = Math.max(...owners.map((o) => o.totalMiles), 1);
  const maxProgramBalance = Math.max(...programs.map((p) => p.balance), 1);

  return (
    <section className="space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Alocação
      </span>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground font-display">👤 Estoque por dono</h3>
            {owners.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Sem donos com estoque.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {owners.slice(0, 5).map((o) => {
                  const color = ownerColor(o.name, ownerColorsByName?.[o.name]);
                  return (
                    <div key={o.name}>
                      <div className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                            aria-hidden
                          />
                          <span className="truncate font-semibold text-foreground">{o.name}</span>
                        </span>
                        <span className="shrink-0 font-bold text-foreground tabular-nums">
                          {o.totalMiles.toLocaleString("pt-BR")} milhas
                        </span>
                      </div>
                      <Bar
                        value={o.totalMiles}
                        max={maxOwnerMiles}
                        style={{ backgroundColor: color }}
                      />
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        R$ {o.totalInvested.toLocaleString("pt-BR")} · {o.cpfCount} CPFs usados
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-foreground font-display">
              🏦 Saldo por programa
            </h3>
            {programs.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Sem saldo por programa.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {programs.slice(0, 5).map((p) => (
                  <div key={p.name}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="truncate font-semibold text-foreground">{p.name}</span>
                      <span className="shrink-0 font-bold text-foreground tabular-nums">
                        {p.balance.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <Bar value={p.balance} max={maxProgramBalance} colorClass="bg-teal" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
