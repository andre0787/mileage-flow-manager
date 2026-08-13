import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guard de regressão da causa raiz do bug "inputs/seleção com fundo branco no dark":
 * o bloco `.dark` do index.css NÃO sobrescrevia `--secondary`/`--secondary-foreground`,
 * então qualquer `dark:bg-secondary` herdava o valor claro do light mode
 * (220 15% 92% ≈ branco) e o texto `foreground` (branco no dark) ficava ilegível.
 *
 * Se este teste falhar, o bug volta: SEMPRE defina --secondary escuro no .dark.
 */

let css = "";

function extractDarkBlock(source: string): string {
  const start = source.indexOf(".dark {");
  if (start === -1) throw new Error(".dark { não encontrado no index.css");
  const end = source.indexOf("}", start);
  if (end === -1) throw new Error("bloco .dark sem fechamento");
  return source.slice(start, end + 1);
}

beforeAll(() => {
  css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
});

describe("tema dark — variáveis secondary (regressão)", () => {
  it("define --secondary no bloco .dark com valor escuro (não herda o claro do light)", () => {
    const darkBlock = extractDarkBlock(css);
    const match = darkBlock.match(/--secondary\s*:\s*([^;]+);/);
    expect(match, "--secondary ausente no .dark — causa raiz do fundo claro").toBeTruthy();
    const value = match![1].trim();
    // Escuro: lightness ≤ 25% (light mode usa 92% ≈ branco)
    const lightness = value.match(/[.\d]+\s*%$/);
    expect(lightness, `--secondary no dark inesperado: ${value}`).toBeTruthy();
    expect(parseFloat(lightness![0])).toBeLessThanOrEqual(25);
  });

  it("define --secondary-foreground no .dark com texto claro", () => {
    const darkBlock = extractDarkBlock(css);
    const match = darkBlock.match(/--secondary-foreground\s*:\s*([^;]+);/);
    expect(
      match,
      "--secondary-foreground ausente no .dark — texto de botões/badges secondary ficaria preto sobre fundo claro",
    ).toBeTruthy();
    expect(match![1].trim()).toMatch(/\d+\s*%/);
  });
});
