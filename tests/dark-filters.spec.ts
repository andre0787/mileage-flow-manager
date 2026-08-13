import { test, expect, type Page } from "@playwright/test";
import { registerUser } from "./helpers";

/**
 * Dark Mode — filtros translúcidos (auditoria dark: filtros e seleções).
 *
 * Garante que os SelectTrigger (filtros de Vendas/Relatórios/Entradas/CPF)
 * usam o tratamento translúcido (bg-secondary/60 + blur) no dark — nunca
 * cinza chapado sólido nem fundo branco ilegível — e que o texto do valor
 * selecionado permanece legível (contraste com o fundo).
 */

async function ensureTheme(page: Page, target: "dark" | "light") {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if ((target === "dark" && !isDark) || (target === "light" && isDark)) {
    await page.getByRole("button", { name: "Toggle theme" }).first().click({ force: true });
    await page.waitForFunction(
      (t) => document.documentElement.classList.contains("dark") === (t === "dark"),
      target,
      { timeout: 5_000 },
    );
    await page.waitForTimeout(450);
  }
}

/** Extrai os componentes (r,g,b,a) de "rgba(...)" ou "rgb(...)" */
function rgbaOf(color: string): { r: number; g: number; b: number; a: number } {
  const m = color.match(/[\d.]+/g)!.map(Number);
  return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
}

test.describe("Dark Mode — filtros translúcidos", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
  });

  test("dark: selects de filtro são translúcidos (não chapado) e texto legível", async ({
    page,
  }) => {
    await ensureTheme(page, "dark");

    // Vendas: OwnerFilter + select de status (filtros da página)
    await page.goto("/vendas");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[role="combobox"]').first()).toBeVisible();

    const triggers = page.locator('[role="combobox"]');
    const count = await triggers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const t = triggers.nth(i);
      const styles = await t.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          backdrop: cs.backdropFilter || cs.webkitBackdropFilter || "",
        };
      });

      const bg = rgbaOf(styles.bg);
      // Dark translúcido: alpha < 1 (vidro) e não é preto puro nem branco chapado
      expect(
        bg.a,
        `trigger #${i} deve ter alpha < 1 (translúcido) — got ${styles.bg}`,
      ).toBeLessThan(1);
      expect(
        bg.r + bg.g + bg.b,
        `trigger #${i} não pode ser branco chapado — got ${styles.bg}`,
      ).toBeLessThan(650);
      expect(
        bg.r + bg.g + bg.b,
        `trigger #${i} não pode ser preto chapado — got ${styles.bg}`,
      ).toBeGreaterThan(20);

      // Texto legível: cor do texto diferente do fundo (contraste)
      const fg = rgbaOf(styles.color);
      const diff = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b);
      expect(diff, `trigger #${i} texto deve contrastar com o fundo`).toBeGreaterThan(100);
    }
  });

  test("dark: busca da página é translúcida e legível (Entradas)", async ({ page }) => {
    await ensureTheme(page, "dark");

    await page.goto("/entradas");
    await page.waitForLoadState("networkidle");

    const input = page.locator("[data-search-input] input").first();
    await expect(input).toBeVisible();

    const styles = await input.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color, backdrop: cs.backdropFilter || "" };
    });

    const bg = rgbaOf(styles.bg);
    expect(bg.a, `busca deve ser translúcida — got ${styles.bg}`).toBeLessThan(1);
    expect(bg.r + bg.g + bg.b, `busca não pode ser branca chapada — got ${styles.bg}`).toBeLessThan(
      650,
    );
    expect(
      bg.r + bg.g + bg.b,
      `busca não pode ser preta chapada — got ${styles.bg}`,
    ).toBeGreaterThan(20);

    const fg = rgbaOf(styles.color);
    const diff = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b);
    expect(diff).toBeGreaterThan(100);
  });

  test("light: filtros mantêm o estilo filled/borderless (sem regressão)", async ({ page }) => {
    await ensureTheme(page, "light");

    await page.goto("/vendas");
    await page.waitForLoadState("networkidle");

    const triggers = page.locator('[role="combobox"]');
    const count = await triggers.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const styles = await triggers
        .nth(i)
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const bg = rgbaOf(styles);
      // Light: fundo claro (soma de canais alta), nunca preto
      expect(
        bg.r + bg.g + bg.b,
        `trigger #${i} deve ser claro no light — got ${styles}`,
      ).toBeGreaterThan(550);
    }
  });
});
