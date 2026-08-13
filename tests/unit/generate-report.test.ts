/**
 * generate-report.test.ts — Testes do gerador de briefing executivo.
 *
 * Uso: npx vitest run tests/unit/generate-report.test.ts -v
 */

import { describe, it, expect } from "vitest";
import {
  computeSessionMetrics,
  sessionHealth,
  escapeHTML,
  generateHTML,
  fallbackTableRow,
} from "../../scripts/generate-report.mjs";

const baseMetrics = {
  lines: 100,
  additions: 40,
  deletions: 10,
  tokens: 75,
  addTokens: 30,
  delTokens: 8,
  overheadTokens: 37,
};

describe("computeSessionMetrics", () => {
  const events = [
    { type: "session:start", timestamp: "2026-08-12T13:00:00Z", description: "inicio" },
    { type: "coding:done", timestamp: "2026-08-12T14:10:00Z", description: "implementado" },
    { type: "code-review:done", timestamp: "2026-08-12T14:40:00Z", description: "aprovado" },
    { type: "pre-pr", timestamp: "2026-08-12T14:50:00Z", description: "pre-pr FAIL", errors: 1 },
    { type: "pre-pr", timestamp: "2026-08-12T15:20:00Z", description: "pre-pr PASS", errors: 0 },
    { type: "rule:fail", timestamp: "2026-08-12T15:05:00Z", description: "rule-10 falhou" },
    { type: "healed", timestamp: "2026-08-12T15:06:00Z", description: "rule-26 auto-corrigido" },
    { type: "pr:create", timestamp: "2026-08-12T15:30:00Z", description: "PR #1" },
    { type: "pr:merge", timestamp: "2026-08-12T16:00:00Z", description: "merged" },
  ];

  it("calcula lead time do início da sessão ao merge em produção", () => {
    const m = computeSessionMetrics(events);
    // 13:00 → 16:00 = 180 min
    expect(m.leadTimeMin).toBe(180);
  });

  it("conta validações pré-PR, violações e auto-correções", () => {
    const m = computeSessionMetrics(events);
    expect(m.prePrTotal).toBe(2);
    expect(m.prePrPass).toBe(1);
    expect(m.prePrFail).toBe(1);
    expect(m.ruleFails).toBe(1);
    expect(m.healed).toBe(1);
    expect(m.codings).toBe(1);
    expect(m.reviews).toBe(1);
    expect(m.prMerges).toBe(1);
  });

  it("monta timeline cronológica com os pontos-chave da sessão", () => {
    const m = computeSessionMetrics(events);
    expect(m.timeline.length).toBeGreaterThanOrEqual(6);
    expect(m.timeline[0].label).toBe("Início da sessão");
    expect(m.timeline.at(-1)!.label).toBe("Merge em produção");
  });

  it("calcula média de outcome grade da telemetria de qualidade", () => {
    const m = computeSessionMetrics(events, [
      { timestamp: "2026-08-12T10:00:00Z", outcomeGrade: 80 },
      { timestamp: "2026-08-12T11:00:00Z", outcomeGrade: 90 },
    ]);
    expect(m.outcomeGrade).toBe(85);
  });

  it("retorna null para lead time quando não há sessão ou merge", () => {
    const m = computeSessionMetrics([
      { type: "pre-pr", timestamp: "2026-08-12T14:00:00Z", errors: 0 },
    ]);
    expect(m.leadTimeMin).toBeNull();
  });
});

describe("sessionHealth", () => {
  it("verde quando saudável", () => {
    expect(sessionHealth({ prMerges: 1, ruleFails: 2, prePrFail: 1 }).tone).toBe("green");
  });
  it("âmbar com muitas violações", () => {
    expect(sessionHealth({ prMerges: 1, ruleFails: 10, prePrFail: 1 }).tone).toBe("amber");
  });
  it("vermelho quando nada entregue e muitas violações", () => {
    expect(sessionHealth({ prMerges: 0, ruleFails: 15, prePrFail: 1 }).tone).toBe("red");
  });
});

describe("escapeHTML", () => {
  it("escapa caracteres especiais", () => {
    expect(escapeHTML('<b>&"x"</b>')).toBe("&lt;b&gt;&amp;&quot;x&quot;&lt;/b&gt;");
  });
});

describe("generateHTML", () => {
  const opts = {
    task: "Auditoria dark mode",
    diff: "+1 linha nova\n-1 linha velha\ncontexto",
    changedFiles: "M src/components/GlobalSearch.tsx\nA tests/dark-mode.spec.ts",
    branch: "feat/dark-ui-audit",
    commit: "abc1234 — commit",
    pr: { number: 360, title: "t" },
    metrics: baseMetrics,
    tableRows: [
      {
        item: "Dark mode",
        fix: "bg elevado",
        benefit: "legível",
        impact: "menos erro",
        tokens: "~200",
      },
    ],
    evidenceUrl: "",
    beforeText: "",
    afterText: "",
    summary: "Entrega validada — UX dark legível",
    impactProduto: "Campos legíveis no dark mode",
    impactNegocio: "Menos risco de erro do usuário",
    impactoProcesso: "Lead time reduzido",
    session: {
      prMerges: 2,
      leadTimeMin: 195,
      prePrTotal: 45,
      prePrFail: 2,
      ruleFails: 10,
      healed: 6,
      codings: 4,
      reviews: 4,
      outcomeGrade: 85,
      tests: 734,
      timeline: [
        { type: "session:start", label: "Início da sessão", time: "13:00" },
        { type: "pr:merge", label: "Merge em produção", time: "16:15" },
      ],
    },
  };

  it("gera one-pager executivo com BLUF, KPIs e saúde", () => {
    const html = generateHTML(opts);
    expect(html).toContain('<section class="slide" id="s1"');
    expect(html).toContain("bluf");
    expect(html).toContain("entregas em produção");
    // ruleFails=10 com healed=6 → 4 violações efetivas → verde ("Saudável")
    expect(html).toContain("Saudável");
    expect(html).toContain("734");
    expect(html).toContain("3h15m");
  });

  it("inclui slide de impacto com as três dimensões", () => {
    const html = generateHTML(opts);
    expect(html).toContain("Impacto de Produto");
    expect(html).toContain("Impacto de Negócio");
    expect(html).toContain("Impacto de Processo");
    expect(html).toContain("Campos legíveis no dark mode");
  });

  it("inclui timeline da sessão e apêndice técnico", () => {
    const html = generateHTML(opts);
    expect(html).toContain("Timeline da sessão");
    expect(html).toContain("Início da sessão");
    expect(html).toContain("Merge em produção");
    expect(html).toContain("Apêndice técnico");
    expect(html).toContain("Detalhamento por item");
    expect(html).toContain("Diff (primeiras 120 linhas)");
  });

  it("escapa narrativa do usuário (XSS-safe)", () => {
    const html = generateHTML({ ...opts, impactProduto: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omite slide de impacto quando não há narrativa", () => {
    const html = generateHTML({
      ...opts,
      impactProduto: "",
      impactNegocio: "",
      impactoProcesso: "",
    });
    expect(html).not.toContain("Impacto de Produto");
    expect(html).toContain('id="s1"');
  });

  it("SEMPRE inclui 'Detalhamento por item' mesmo sem rows (garantia rule-08)", () => {
    const html = generateHTML({ ...opts, tableRows: [] });
    // Seção presente com as 5 colunas
    expect(html).toContain("Detalhamento por item");
    expect(html).toContain("Correção Efetuada");
    expect(html).toContain("Impacto no Negócio");
    expect(html).toContain("Custo Token");
    // Fallback de 1 linha derivada da task + impactos
    expect(html).toContain("Entrega da sessão");
    expect(html).toContain(opts.task);
    expect(html).toContain("Campos legíveis no dark mode");
  });
});

describe("fallbackTableRow", () => {
  it("usa impactos da sessão e tokens do diff", () => {
    const row = fallbackTableRow("Fix dark", "UX legível", "Menos erro", {
      tokens: 420,
    });
    expect(row.item).toBe("Entrega da sessão");
    expect(row.fix).toBe("Fix dark");
    expect(row.benefit).toBe("UX legível");
    expect(row.impact).toBe("Menos erro");
    expect(row.tokens).toBe("~420");
  });

  it("tem defaults sensatos quando não há narrativa nem tokens", () => {
    const row = fallbackTableRow("Sessão", "", "", null);
    expect(row.benefit).toContain("qualidade");
    expect(row.impact).toContain("Risco");
    expect(row.tokens).toBe("—");
  });
});
