import { useMemo } from "react";
import { Activity, BarChart3, Bug, FileText, Flame, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentLabEvidence } from "@/components/agent-lab/AgentLabEvidence";
import { AgentLabExperiments } from "@/components/agent-lab/AgentLabExperiments";
import { AgentLabMutations } from "@/components/agent-lab/AgentLabMutations";
import { AgentLabOverview } from "@/components/agent-lab/AgentLabOverview";
import { AgentLabPromotions } from "@/components/agent-lab/AgentLabPromotions";
import { AgentLabTelemetry } from "@/components/agent-lab/AgentLabTelemetry";
import { getExperiments, getLatestExperiment } from "@/lib/agentLabData";

const tabs = [
  { value: "overview", label: "Overview", icon: Activity },
  { value: "mutations", label: "Mutations", icon: Bug },
  { value: "experiments", label: "Experiments", icon: FlaskConical },
  { value: "evidence", label: "Evidence", icon: FileText },
  { value: "promotions", label: "Promotions", icon: Flame },
  { value: "telemetry", label: "Telemetry", icon: BarChart3 },
];

export default function AgentLab() {
  const experiments = useMemo(() => getExperiments(), []);
  const latestExperiment = useMemo(() => getLatestExperiment(), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FlaskConical className="h-6 w-6 text-primary" /> Agent Lab
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            P12.6 — Agent QA Mutation Lab + Promotion Intelligence
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Environment: {import.meta.env.MODE || "development"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1">
              <Icon className="h-3 w-3" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <AgentLabOverview experiment={latestExperiment} />
        </TabsContent>
        <TabsContent value="mutations">
          <AgentLabMutations experiment={latestExperiment} />
        </TabsContent>
        <TabsContent value="experiments">
          <AgentLabExperiments experiments={experiments} />
        </TabsContent>
        <TabsContent value="evidence">
          <AgentLabEvidence experiment={latestExperiment} />
        </TabsContent>
        <TabsContent value="promotions">
          <AgentLabPromotions />
        </TabsContent>
        <TabsContent value="telemetry">
          <AgentLabTelemetry experiment={latestExperiment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
