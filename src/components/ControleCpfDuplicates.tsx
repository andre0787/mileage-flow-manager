import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateBR } from "@/lib/dateUtils";
import type { DuplicatePassenger } from "@/lib/passengerDuplicates";

export function ControleCpfDuplicates({ duplicates }: { duplicates: DuplicatePassenger[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="h-5 w-5 text-primary" />
          Passageiros em Mais de Uma Emissão
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Apenas sinalizados — não contam no limite de passageiros
        </p>
      </CardHeader>
      <CardContent>
        {duplicates.length > 0 ? (
          <div className="space-y-2">
            {duplicates.map((dup) => (
              <div
                key={dup.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{dup.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{dup.cpf}</p>
                  <p className="text-xs text-muted-foreground">
                    {dup.emissions.map((e) => `${e.program} · ${formatDateBR(e.date)}`).join(" — ")}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 self-start sm:self-center">
                  {dup.emissionCount} emissões
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum passageiro em mais de uma emissão para os filtros selecionados
          </p>
        )}
      </CardContent>
    </Card>
  );
}
