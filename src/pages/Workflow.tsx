import { Suspense } from "react";
import { WorkflowHero } from "@/components/workflow/WorkflowHero";
import { WorkflowJourney } from "@/components/workflow/WorkflowJourney";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import { WorkflowMindMap } from "@/components/workflow/WorkflowMindMap";
import { WorkflowGates } from "@/components/workflow/WorkflowGates";
import { WorkflowTelemetry } from "@/components/workflow/WorkflowTelemetry";
import { WorkflowEfficiency } from "@/components/workflow/WorkflowEfficiency";
import { WorkflowSimulator } from "@/components/workflow/WorkflowSimulator";
import { WorkflowOverview } from "@/components/workflow/WorkflowOverview";
import { WorkflowDataFooter } from "@/components/workflow/WorkflowDataFooter";

/** Skeleton enquanto o JSON de dados reais carrega (use() suspende). */
const DataSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 w-40 rounded bg-muted" />
    <div className="h-24 rounded-xl bg-muted" />
  </div>
);

/**
 * Workflow — página "Workflow" (aba no webapp).
 *
 * Port do relatório ilustrativo docs/workflow-demo/workflow-illustrated.html
 * para React + Tailwind + shadcn. Mantém as 7 seções do relatório:
 * hero → jornada → linha do tempo → mapa mental → gates → telemetria → simulador.
 * Seções com dados reais (Overview/Telemetry/Efficiency/Footer) resolvem o
 * JSON via use() — o Suspense mostra o skeleton enquanto carrega.
 */
export default function Workflow() {
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-8">
      <WorkflowHero />

      <section className="border-t pt-8" aria-label="Visão geral do projeto">
        <Suspense fallback={<DataSkeleton />}>
          <WorkflowOverview />
        </Suspense>
      </section>

      <section className="border-t pt-8" aria-label="A jornada">
        <WorkflowJourney />
      </section>

      <section className="border-t pt-8" aria-label="Linha do tempo do workflow">
        <WorkflowTimeline />
      </section>

      <section className="border-t pt-8" aria-label="Mapa mental do workflow">
        <WorkflowMindMap />
      </section>

      <section className="border-t pt-8" aria-label="Os portões">
        <WorkflowGates />
      </section>

      <section className="border-t pt-8" aria-label="A telemetria">
        <Suspense fallback={<DataSkeleton />}>
          <WorkflowTelemetry />
        </Suspense>
      </section>

      <section className="border-t pt-8" aria-label="Eficiência dos gates">
        <Suspense fallback={<DataSkeleton />}>
          <WorkflowEfficiency />
        </Suspense>
      </section>

      <section className="border-t pt-8" aria-label="Experimente">
        <WorkflowSimulator />
      </section>

      <footer className="border-t pt-6 text-center">
        <p className="text-sm text-foreground">
          <b>MilesControl</b> · guia ilustrado do workflow
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Dados de telemetria extraídos de docs/tracking/ · números reais do repositório em{" "}
          <Suspense
            fallback={
              <span className="inline-block h-3 w-16 animate-pulse rounded bg-muted align-middle" />
            }
          >
            <WorkflowDataFooter />
          </Suspense>{" "}
          · gerado em {today}
        </p>
      </footer>
    </div>
  );
}
