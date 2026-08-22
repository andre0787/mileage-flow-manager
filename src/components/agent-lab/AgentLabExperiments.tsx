import { FlaskConical } from "lucide-react";
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
import { formatExperimentDate, type AgentLabExperiment } from "@/lib/agentLabData";

export function AgentLabExperiments({ experiments }: { experiments: AgentLabExperiment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" /> Experiment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {experiments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FlaskConical className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>No experiments run yet.</p>
            <p className="mt-1 text-sm">Run npm run p12.6:experiment to start.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Recall</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiments.map((e) => (
                <TableRow key={e.experimentId}>
                  <TableCell className="font-mono">{e.experimentId}</TableCell>
                  <TableCell>{formatExperimentDate(e.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.mode}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{e.recall.toFixed(1)}%</TableCell>
                  <TableCell className="font-mono">{e.precision.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge>{e.missed === 0 ? "completed" : "review"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
