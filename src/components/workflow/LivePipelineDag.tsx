/**
 * LivePipelineDag.tsx — Fetches live telemetry from ai_telemetry
 * and passes to WorkflowPipelineDag for the DAG visualization.
 */

import { Suspense, use } from "react";
import { loadEnvelopes } from "@/lib/telemetryAdapter";
import WorkflowPipelineDag from "./WorkflowPipelineDag";

function LiveContent() {
  // loadEnvelopes tem cache TTL próprio — refetch automático sem recarregar.
  const envelopes = use(loadEnvelopes());
  return <WorkflowPipelineDag envelopes={envelopes} />;
}

export default function LivePipelineDag() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Pipeline real (DAG)</h3>
            <span className="text-xs text-muted-foreground">Carregando...</span>
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
