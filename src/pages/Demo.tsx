import { useActionState, useMemo, useState } from "react";
import { Link } from "react-router";
import { DemoAccessGate, DemoLifecycle, addDemoEntry, TENANTS } from "@/ai/e2e";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, RotateCcw } from "lucide-react";

/**
 * Demo.tsx — Página de demonstração anônima (P12.5-02/03).
 *
 * Acesso sem login em /demo, isolada no tenant lógico __demo__ (fixtures em
 * memória — NUNCA o Supabase real). Reset restaura o fixture determinístico.
 * Desligamento imediato: VITE_PUBLIC_DEMO_ENABLED !== "true" → tela de aviso.
 *
 * Selectors (usados pelo Scenario Registry / Playwright):
 *   #dashboard-total, #entry-list tr, #open-mileage-form, #program,
 *   #miles, #description, #submit-entry, #validation-error, #reset-demo
 */

const DEMO_ENABLED = import.meta.env.VITE_PUBLIC_DEMO_ENABLED === "true";

export default function Demo() {
  const lifecycle = useMemo(() => new DemoLifecycle(), []);
  const [, force] = useState(0);
  const refresh = () => force((n) => n + 1);

  // Demo Access Gate (P12.5-02): anônimo → contexto demo, nunca autenticado.
  const gate = useMemo(() => {
    if (!DEMO_ENABLED)
      return {
        allowed: false as const,
        reason: "demo disabled (VITE_PUBLIC_DEMO_ENABLED != true)",
      };
    const g = new DemoAccessGate({
      enabled: true,
      maxRequestsPerMinute: 30,
      maxRequestsPerMinutePerIp: 60,
      windowMs: 60_000,
      maxActiveSessions: 200,
    });
    return g.decide("__public_demo_session__", "local");
  }, []);

  const [formState, formAction] = useActionState<{ message: string | null }, FormData>(
    async (_prev, formData) => {
      const program = String(formData.get("program") ?? "");
      const milesRaw = String(formData.get("miles") ?? "");
      const description = String(formData.get("description") ?? "");
      const miles = Number(milesRaw.replace(",", "."));
      if (!Number.isFinite(miles) || miles <= 0) {
        return { message: "milhas inválidas" };
      }
      const account = lifecycle.current.accounts.find((a) => a.program === program);
      if (!account) return { message: "conta demo não encontrada" };
      lifecycle.mutate((d) =>
        addDemoEntry(d, {
          accountId: account.id,
          date: new Date().toISOString().slice(0, 10),
          miles,
          description,
          origem: "Demo",
        }),
      );
      refresh();
      return { message: null };
    },
    { message: null },
  );

  if (!gate.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" /> Demo indisponível
            </CardTitle>
            <CardDescription>{gate.reason}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">Ir para login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dataset = lifecycle.current;
  const totalMiles = dataset.accounts.reduce((s, a) => s + a.totalMiles, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Demo anônimo — tenant {TENANTS.demo}</Badge>
          <span className="text-sm text-muted-foreground">dados isolados · reset disponível</span>
          <Button
            className="ml-auto"
            size="sm"
            variant="outline"
            id="reset-demo"
            onClick={() => {
              lifecycle.reset();
              refresh();
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Reset demo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard demo</CardTitle>
            <CardDescription>Total de milhas no tenant demo (fixtures)</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="dashboard-total" className="text-4xl font-display font-bold">
              {totalMiles.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova entrada (demo)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* noValidate: a validação é do app (form-validation scenario), não do browser */}
            <form action={formAction} noValidate className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="open-mileage-form">Programa</Label>
                <select
                  id="program"
                  name="program"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue="Smiles"
                >
                  {dataset.accounts.map((a) => (
                    <option key={a.id} value={a.program}>
                      {a.program}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="miles">Milhas</Label>
                <Input id="miles" name="miles" type="number" placeholder="1500" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" placeholder="Demo compra" />
              </div>
              <div id="open-mileage-form" />
              {formState.message && (
                <p id="validation-error" className="text-sm text-destructive">
                  {formState.message}
                </p>
              )}
              <Button type="submit" id="submit-entry">
                Criar entrada
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entradas do demo</CardTitle>
            <CardDescription>
              {dataset.entries.length} entradas · fixture + mutações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" id="entry-list">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Descrição</th>
                  <th className="pb-2">Origem</th>
                  <th className="pb-2 text-right">Milhas</th>
                </tr>
              </thead>
              <tbody>
                {dataset.entries.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="py-2">{e.date}</td>
                    <td className="py-2">{e.description}</td>
                    <td className="py-2">{e.origem}</td>
                    <td id={`entry-${e.id}-miles`} className="py-2 text-right">
                      {e.miles.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
