import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const WF = resolve(ROOT, ".github/workflows/normalize-pr-report.yml");

describe("normalize-pr-report workflow (P0: PRs blocked por [skip ci])", () => {
  it("não usa [skip ci] no commit de normalize", () => {
    const content = readFileSync(WF, "utf8");
    // O commit do normalize é feito na branch do PR; com [skip ci] o
    // CI PR Check não roda no head renomeado → branch protection bloqueia.
    expect(content).not.toMatch(/git commit[^\n]*\[skip ci\]/);
  });

  it("dispara em pull_request opened (documentando o gatilho)", () => {
    const content = readFileSync(WF, "utf8");
    expect(content).toMatch(/pull_request:\s*\n\s*types:\s*\[opened\]/);
  });
});

describe("deploy workflow (deploy automático pós-merge)", () => {
  const DEPLOY = resolve(ROOT, ".github/workflows/deploy.yml");
  const content = readFileSync(DEPLOY, "utf8");

  it("dispara por repository_dispatch deploy (bot do auto-merge não gera push)", () => {
    expect(content).toMatch(/repository_dispatch:\s*\n\s*types:\s*\[deploy\]/);
  });

  it("não usa mais push como gatilho (evita deploy duplicado com dispatch)", () => {
    expect(content).not.toMatch(/^\s*push:\s*$/m);
  });

  it("mantém AUTH Gate do workflow_dispatch (regra 35)", () => {
    expect(content).toMatch(/workflow_dispatch:/);
    expect(content).toMatch(/auth_phrase:/);
    expect(content).toMatch(/🔐 AUTH Gate/);
    expect(content).toMatch(/Autorizo o deploy para produção/);
    expect(content).toMatch(/github\.event_name == 'workflow_dispatch'/);
  });

  it("não roda upgrade global de npm (Node 22 já traz npm suficiente)", () => {
    expect(content).not.toMatch(/npm install -g npm/);
  });
});

describe("auto-merge workflow (dispara deploy após merge)", () => {
  const AUTO_MERGE = resolve(ROOT, ".github/workflows/auto-merge.yml");
  const content = readFileSync(AUTO_MERGE, "utf8");

  it("tem permissão actions: write para repository_dispatch", () => {
    expect(content).toMatch(/actions: write/);
  });

  it("dispara repository_dispatch 'deploy' após o merge", () => {
    expect(content).toMatch(/dispatches/);
    expect(content).toMatch(/event_type="deploy"/);
  });
});

describe("ci workflow (eficiência PR)", () => {
  const CI = resolve(ROOT, ".github/workflows/ci.yml");
  const content = readFileSync(CI, "utf8");

  it("roda e2e-smoke de forma priojizada: só quando código muda (paths-filter)", () => {
    expect(content).toMatch(/dorny\/paths-filter@v3/);
    expect(content).toMatch(/needs: \[changes\]/);
    expect(content).toMatch(/needs\.changes\.outputs\.code == 'true'/);
    // não há mais dependência serial do check-pr
    const smokeBlock = content.split(/\n\s*e2e-smoke:/)[1] ?? "";
    expect(smokeBlock).not.toMatch(/needs: \[check-pr\]/);
  });

  it("cacheia browsers do Playwright keyed por lockfile", () => {
    expect(content).toMatch(/Cache Playwright browsers/);
    expect(content).toMatch(/actions\/cache@v4/);
    expect(content).toMatch(/hashFiles\('package-lock.json'\)/);
  });

  it("não tem trigger morto chore/npm-vuln-radar", () => {
    expect(content).not.toMatch(/npm-vuln-radar/);
  });

  it("concurrency serial (cancel-in-progress: false) — evita run fantasma do bot normalize", () => {
    // Run fantasma: push do bot normalize cancela o run anterior (cancel-in-progress: true)
    // e o run novo nasce action_required com 0 jobs — PR fica sem checks no head final.
    expect(content).toMatch(/cancel-in-progress: false/);
    expect(content).not.toMatch(/cancel-in-progress: true/);
  });
});

describe("nightly workflow (split paralelo)", () => {
  const NIGHTLY = resolve(ROOT, ".github/workflows/nightly.yml");
  const content = readFileSync(NIGHTLY, "utf8");

  it("tem 2 jobs paralelos (quality-and-check ‖ e2e-full)", () => {
    expect(content).toMatch(/quality-and-check:/);
    expect(content).toMatch(/e2e-full:/);
    expect(content).not.toMatch(/check:nightly/);
  });

  it("cacheia browsers do Playwright", () => {
    expect(content).toMatch(/Cache Playwright browsers/);
    expect(content).toMatch(/actions\/cache@v4/);
  });
});

describe("deploy workflow — alerta smoke-prod", () => {
  const DEPLOY = resolve(ROOT, ".github/workflows/deploy.yml");
  const content = readFileSync(DEPLOY, "utf8");

  it("cria issue de alerta quando o smoke de produção falha", () => {
    expect(content).toMatch(/Alerta de falha do smoke de produção/);
    expect(content).toMatch(/gh issue create/);
    expect(content).toMatch(/steps\.smoke\.outcome == 'failure'/);
  });

  it("tem permissão issues: write", () => {
    expect(content).toMatch(/issues: write/);
  });
});