/**
 * LiveAiEngineeringCommandCenter.tsx — Fetches live telemetry from ai_telemetry
 * and passes to AiEngineeringCommandCenter for the KPI dashboard.
 */

import { Suspense, use } from "react";
import { loadEnvelopes } from "@/lib/telemetryAdapter";
import AiEngineeringCommandCenter from "./AiEngineeringCommandCenter";

function LiveContent() {
  // loadEnvelopes tem cache TTL próprio — refetch automático sem recarregar.
  const envelopes = use(loadEnvelopes());
  return <AiEngineeringCommandCenter envelopes={envelopes} />;
}

export default function LiveAiEngineeringCommandCenter() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold">🤖 AI Engineering Command Center</h3>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <LiveContent />
    </Suspense>
  );
}
