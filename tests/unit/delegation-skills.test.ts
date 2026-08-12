import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(import.meta.dirname, "../..");

const SKILLS = ["compact-delegation", "bounded-scout", "diff-miner", "test-triage"];

function readSkill(name: string): string {
  return readFileSync(resolve(ROOT, `.pi/skills/${name}/SKILL.md`), "utf8");
}

describe("skills de delegação econômica", () => {
  it("todas as 4 skills existem em .pi/skills/ com SKILL.md", () => {
    for (const s of SKILLS) {
      expect(existsSync(resolve(ROOT, `.pi/skills/${s}/SKILL.md`))).toBe(true);
    }
  });

  it("frontmatter: name e description válidos (terceira pessoa, 'Use when...')", () => {
    for (const s of SKILLS) {
      const content = readSkill(s);
      const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
      expect(fm).toContain(`name: ${s}`);
      expect(fm).toMatch(/description:/);
      expect(fm).toMatch(/Use when/);
      // Sem descrição em primeira pessoa
      expect(fm).not.toMatch(/I (can|will|help)/);
    }
  });

  it("cada skill é enxuta (< 3400 chars) — custo de carregamento baixo", () => {
    for (const s of SKILLS) {
      expect(readSkill(s).length).toBeLessThan(3400);
    }
  });

  it("contrato de retorno: cada skill define output estruturado de campos-chave", () => {
    expect(readSkill("bounded-scout")).toMatch(/file \| line \| finding/);
    expect(readSkill("diff-miner")).toMatch(/impact:/);
    expect(readSkill("diff-miner")).toMatch(/risk:/);
    expect(readSkill("diff-miner")).toMatch(/files:/);
    expect(readSkill("test-triage")).toMatch(/cause:/);
    expect(readSkill("test-triage")).toMatch(/fix:/);
    expect(readSkill("test-triage")).toMatch(/evidence:/);
  });

  it("registradas: AGENTS.md, MAP.md, rule-23 e prompt-manifest (rule-29)", () => {
    const agents = readFileSync(resolve(ROOT, "AGENTS.md"), "utf8");
    const map = readFileSync(resolve(ROOT, "docs/MAP.md"), "utf8");
    const rule23 = readFileSync(resolve(ROOT, "scripts/rules/rule-23-skill-orphans.mjs"), "utf8");
    const pm = readFileSync(resolve(ROOT, "scripts/prompt-manifest.mjs"), "utf8");
    const r29 = readFileSync(resolve(ROOT, "scripts/rules/rule-29-prompt-version.mjs"), "utf8");
    const manifest = readFileSync(resolve(ROOT, ".prompts-manifest.json"), "utf8");

    for (const s of SKILLS) {
      expect(agents).toContain(s);
      expect(map).toContain(s);
      expect(rule23).toContain(s);
      expect(pm).toContain(`.pi/skills/${s}/SKILL.md`);
      expect(r29).toContain(`.pi/skills/${s}/SKILL.md`);
      expect(manifest).toContain(`.pi/skills/${s}/SKILL.md`);
    }
  });

  it("compact-delegation proíbe herança de contexto e eco de arquivos", () => {
    const cd = readSkill("compact-delegation");
    expect(cd).toMatch(/Never inherit your session's context/);
    expect(cd).toMatch(/No code blocks unless explicitly requested/);
  });
});
