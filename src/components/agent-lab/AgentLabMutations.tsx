import { Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentLabExperiment, MutationStatus } from "@/lib/agentLabData";

const statusClass: Record<MutationStatus, string> = {
  detected: "bg-green-500/10 text-green-700",
  fixed: "bg-blue-500/10 text-blue-700",
  regression: "bg-red-500/10 text-red-700",
  missed: "bg-yellow-500/10 text-yellow-700",
  skipped: "bg-gray-500/10 text-gray-700",
};

export function AgentLabMutations({ experiment }: { experiment: AgentLabExperiment | null }) {
  const results = experiment?.results ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" /> Mutation Catalog — {results.length} mutations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum experimento encontrado. Rode npm run p12.6:experiment.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Triage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono font-bold">{m.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.severity === "critical" ? "destructive" : "secondary"}>
                      {m.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[m.status]}`}
                    >
                      {m.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {m.confidence ? `${Math.round(m.confidence * 100)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{m.triage ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
