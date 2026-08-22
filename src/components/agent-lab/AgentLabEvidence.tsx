import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentLabExperiment } from "@/lib/agentLabData";

export function AgentLabEvidence({ experiment }: { experiment: AgentLabExperiment | null }) {
  const evidence = experiment?.results.filter((r) => r.evidenceId) ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Evidence Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evidence.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No evidence collected yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {evidence.map((item) => (
              <div key={item.evidenceId} className="rounded-lg border p-3 text-sm">
                <div className="font-mono font-semibold">{item.evidenceId}</div>
                <div className="text-muted-foreground">
                  {item.id} · {item.category} · {item.severity}
                </div>
                <p className="mt-2 text-xs">{item.rootCause ?? "Sem hipótese registrada."}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
