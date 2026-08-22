import { WHAT_CARDS, HERO_META } from "@/lib/workflowStaticData";
import { Card, CardContent } from "@/components/ui/card";

/**
 * WorkflowHero — header + "O que é o MilesControl?".
 * Port da seção hero e "Comece por aqui" do relatório ilustrativo.
 */
export function WorkflowHero() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-10 text-center">
        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          🧭 Guia ilustrado · leve 3 minutos
        </span>
        <h1 className="mt-4 text-2xl md:text-4xl font-bold text-foreground font-display">
          Como o nosso workflow funciona
        </h1>
        <p className="mt-3 mx-auto max-w-2xl text-sm md:text-base text-muted-foreground">
          Um passeio visual pelo <b className="text-foreground">MilesControl</b> — o fluxo que
          transforma uma ideia em entrega com segurança, mostrando cada etapa, cada{" "}
          <b className="text-foreground">gate</b> de qualidade e a{" "}
          <b className="text-foreground">telemetria</b> registrada no caminho.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {HERO_META.map((m) => (
            <span
              key={m}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comece por aqui
        </span>
        <h2 className="mt-1 text-xl md:text-2xl font-bold text-foreground font-display">
          O que é o MilesControl?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-3xl">
          É um projeto web de gestão de milhas aéreas. Mas o que você vai ver aqui não é o app: é o{" "}
          <b className="text-foreground">processo por trás dele</b> — o workflow que garante que
          toda mudança seja testada, revisada e rastreável antes de chegar à produção.
        </p>
        <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
          {WHAT_CARDS.map((c) => (
            <Card key={c.title}>
              <CardContent className="p-5">
                <div className="text-[28px]">{c.emoji}</div>
                <h3 className="mt-2 text-base font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
