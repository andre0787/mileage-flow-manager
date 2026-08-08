import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkflowHero } from "@/components/workflow/WorkflowHero";
import { WorkflowJourney } from "@/components/workflow/WorkflowJourney";
import { WorkflowGates } from "@/components/workflow/WorkflowGates";
import { WorkflowSimulator } from "@/components/workflow/WorkflowSimulator";
import { WorkflowMindMap, __mindTest } from "@/components/workflow/WorkflowMindMap";

const { estWidth, computeLayout, linePath } = __mindTest;

describe("WorkflowHero", () => {
  it("renderiza título, subtítulo e cards do que é", () => {
    render(<WorkflowHero />);
    expect(screen.getByText("Como o nosso workflow funciona")).toBeDefined();
    expect(screen.getByText("O que é o MilesControl?")).toBeDefined();
    expect(screen.getByText("Uma ideia entra")).toBeDefined();
    expect(screen.getByText("Gates verificam")).toBeDefined();
    expect(screen.getByText("Entrega sai")).toBeDefined();
  });

  it("renderiza as 4 metas do hero", () => {
    render(<WorkflowHero />);
    expect(screen.getByText("✅ 39 regras validadas a cada pre-pr")).toBeDefined();
    expect(screen.getByText("🛡️ 4 gates de segurança")).toBeDefined();
    expect(screen.getByText("📡 telemetria em toda etapa")).toBeDefined();
  });
});

describe("WorkflowJourney", () => {
  it("renderiza as etapas da jornada", () => {
    render(<WorkflowJourney />);
    expect(screen.getByText("De ideia a entrega, passo a passo")).toBeDefined();
    expect(screen.getByText("Sessão começa")).toBeDefined();
    expect(screen.getByText("PR → review → merge")).toBeDefined();
  });

  it("abre e fecha a evidência ao clicar (primeira etapa já aberta)", () => {
    render(<WorkflowJourney />);
    // primeira etapa aberta por padrão (rule-26)
    expect(screen.getByText(/docs\/handoff\.md atualizado automaticamente/)).toBeDefined();
    // clicar na etapa "PR → review → merge" abre a evidência
    fireEvent.click(screen.getByText("PR → review → merge"));
    expect(screen.getByText(/branch → PR \(base: main\) → checks CI/)).toBeDefined();
    // clicar de novo fecha
    fireEvent.click(screen.getByText("PR → review → merge"));
    expect(screen.queryByText(/branch → PR \(base: main\) → checks CI/)).toBeNull();
  });
});

describe("WorkflowGates", () => {
  it("renderiza os 6 portões com suas regras", () => {
    render(<WorkflowGates />);
    expect(screen.getByText("4 gates que protegem a entrega")).toBeDefined();
    expect(screen.getByText("INTENT Gate")).toBeDefined();
    expect(screen.getByText("TWINS Check")).toBeDefined();
    expect(screen.getByText("AUTH Gate")).toBeDefined();
    expect(screen.getByText("Evidence Gates")).toBeDefined();
    expect(screen.getByText("Council / Spec")).toBeDefined();
    expect(screen.getByText("RTK ativo")).toBeDefined();
  });
});

describe("WorkflowSimulator", () => {
  it("mostra placeholder inicial e muda ao clicar nos cenários", () => {
    render(<WorkflowSimulator />);
    expect(screen.getByText(/Clique em um cenário acima para simular/)).toBeDefined();
    fireEvent.click(screen.getByText("🛠️ Enviar PR sem evidência de review"));
    expect(screen.getAllByText(/❌ 3 errors — PR BLOQUEADO/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("✅ Fluxo completo com evidências"));
    expect(screen.getAllByText(/✅ 0 errors — PR LIBERADO/).length).toBeGreaterThan(0);
  });
});

describe("WorkflowMindMap (layout determinístico)", () => {
  it("estima a largura do texto sem medir DOM", () => {
    expect(estWidth("Sessão", 1)).toBeCloseTo(6 * 17 * 0.62, 2);
    expect(estWidth("abc", 2)).toBeCloseTo(3 * 13.5 * 0.62, 2);
    expect(estWidth("Sessão", 1)).toBeGreaterThan(estWidth("abc", 2));
  });

  it("computa layout com 9 ramos e folhas conectadas", () => {
    const { nodes, lines } = computeLayout();
    const branches = nodes.filter((n) => n.level === 1);
    const leaves = nodes.filter((n) => n.level === 2);
    expect(branches).toHaveLength(9);
    expect(leaves.length).toBeGreaterThan(9);
    // linhas: 9 centro→ramo + 1 por folha
    expect(lines.filter((l) => l.from === "root")).toHaveLength(9);
    expect(lines.length).toBe(9 + leaves.length);
  });

  it("toda folha tem pai válido e fica no setor do ramo", () => {
    const { nodes } = computeLayout();
    const branches = nodes.filter((n) => n.level === 1);
    const leaves = nodes.filter((n) => n.level === 2);
    const branchIds = new Set(branches.map((b) => b.id));
    leaves.forEach((l) => {
      expect(branchIds.has(l.parentId ?? "")).toBe(true);
    });
  });

  it("linePath gera curva bezier com origem raiz", () => {
    const { nodes, lines } = computeLayout();
    const rootLine = lines.find((l) => l.from === "root");
    expect(rootLine).toBeDefined();
    const d = linePath(rootLine!, new Map(nodes.map((n) => [n.id, n])));
    expect(d.startsWith("M 700 575 Q")).toBe(true);
  });

  it("renderiza o SVG do mapa com painel inicial", () => {
    render(<WorkflowMindMap />);
    expect(screen.getByText("Mapa mental do workflow")).toBeDefined();
    expect(screen.getByText(/👆 Clique em um nó/)).toBeDefined();
    expect(screen.getByLabelText("Mapa mental do workflow MilesControl")).toBeDefined();
  });

  it("renderiza os botões de ação do mapa", () => {
    render(<WorkflowMindMap />);
    expect(screen.getByText("🔄 Limpar seleção")).toBeDefined();
    expect(screen.getByText("🧲 Reposicionar")).toBeDefined();
  });

  it("restaura posições do localStorage sem perder dados do nó", () => {
    const firstNode = computeLayout().nodes[0];
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue(JSON.stringify({ [firstNode.id]: { x: 123, y: 456 } }));
    const { container } = render(<WorkflowMindMap />);
    const firstRect = container.querySelector("g rect");
    expect(firstRect?.getAttribute("x")).toBe(String(123 - firstNode.w / 2));
    expect(firstRect?.getAttribute("y")).toBe(String(456 - firstNode.h / 2));
    expect(screen.getByText("Mapa mental do workflow")).toBeDefined();
    spy.mockRestore();
  });
});
