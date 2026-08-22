import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SourceRegistry } from "@/ai/mutation/promotion/source-registry";

const registry = new SourceRegistry();

export function AgentLabPromotions() {
  const sources = registry.getAllSources();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Summary label="Sources" value={sources.length} />
        <Summary label="Enabled" value={sources.filter((s) => s.enabled).length} />
        <Summary label="Fresh" value={sources.filter((s) => s.health === "FRESH").length} />
        <Summary
          label="Avg reliability"
          value={`${Math.round(avg(sources.map((s) => s.reliability)) * 100)}%`}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" /> Source Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.sourceId}>
                  <TableCell className="font-medium">{s.program}</TableCell>
                  <TableCell>{s.health}</TableCell>
                  <TableCell className="font-mono text-sm">{s.collectionFrequency}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {Math.round(s.reliability * 100)}%
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                    {s.officialUrl}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
