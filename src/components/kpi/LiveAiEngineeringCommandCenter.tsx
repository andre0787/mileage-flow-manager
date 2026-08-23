/**
 * LiveAiEngineeringCommandCenter.tsx — Fetches live telemetry from ai_telemetry
 * and passes to AiEngineeringCommandCenter for the KPI dashboard.
 */

import { Suspense, use } from "react";
import { loadEnvelopes } from "@/lib/telemetryAdapter";
import AiEngineeringCommandCenter from "./AiEngineeringCommandCenter";

let envelopePromise: ReturnType<typeof loadEnvelopes> | null = null;

function LiveContent() {
  if (!envelopePromise) envelopePromise = loadEnvelopes();
  const envelopes = use(envelopePromise);
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
