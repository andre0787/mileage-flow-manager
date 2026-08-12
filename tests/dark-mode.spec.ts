import { test, expect, type Page } from "@playwright/test";
import { registerUser } from "./helpers";

/**
 * Dark Mode — consistência visual (regressão #359 + auditoria de contraste).
 *
 * Garante que campos (input/textarea/select) usam fundo elevado + borda
 * nítida no dark (nada de cinza chapado ou preto sobre preto), e que o
 * light mode preserva o estilo borderless/filled.
 */

async function ensureTheme(page: Page, target: "dark" | "light") {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if ((target === "dark" && !isDark) || (target === "light" && isDark)) {
    // Nome acessível vem do texto sr-only do ThemeToggle (não é atributo aria-label)
    await page.getByRole("button", { name: "Toggle theme" }).first().click({ force: true });
    await page.waitForFunction(
      (t) => document.documentElement.classList.contains("dark") === (t === "dark"),
      target,
      { timeout: 5_000 },
    );
    // Transição de cores do tema (~300ms) — aguarda assentar antes de ler estilos
    await page.waitForTimeout(450);
  }
}

/** backgroundColor computado de um seletor (string "rgb(...)" / "rgba(...)") */
function bgOf(selector: string) {
  return (page: Page) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return window.getComputedStyle(el).backgroundColor;
    }, selector);
}

/** Estilos computados via locator — espera o elemento existir antes de ler */
async function stylesOf(locator: ReturnType<Page["getByPlaceholder"]>, props: string[]) {  return locator.evaluate((el, keys) => {
    const cs = window.getComputedStyle(el);
    const camel = (k: string) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return Object.fromEntries(
      keys.map((k) => [camel(k), cs.getPropertyValue(k)]),
    ) as Record<string, string>;
  }, props);
}

test.describe("Dark Mode — consistência visual", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
  });

  test("dark: busca, sidebar e textarea destacam do fundo preto (sem cinza chapado)", async ({
    page,
  }) => {
    await ensureTheme(page, "dark");

    // 1. Fundo da página é preto puro (iOS black)
    expect(await bgOf("body")(page)).toBe("rgb(0, 0, 0)");

    // 2. Campo de busca global (GlobalSearch): fundo elevado + borda visível no dark
    const searchInput = page.getByPlaceholder("Buscar…");
    await expect(searchInput).toBeVisible();
    const { backgroundColor: inputBg, borderLeftColor: inputBorder } = await stylesOf(searchInput, [
      "background-color",
      "border-left-color",
    ]);
    expect(inputBg).not.toBe("rgb(0, 0, 0)");
    expect(inputBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(inputBorder).not.toBe("rgba(0, 0, 0, 0)");

    // 4. Sidebar elevada (7% ≠ preto puro) — separa visualmente da página
    const sidebarBg = await bgOf('[data-sidebar="sidebar"]')(page);
    expect(sidebarBg).not.toBe("rgb(0, 0, 0)");

    // 5. Textarea do FeedbackDialog: fundo elevado + borda nítida
    await page.locator("text=Reportar problema").first().click();
    const textarea = page.locator("textarea#message");
    await expect(textarea).toBeVisible();
    const taBg = await textarea.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(taBg).not.toBe("rgb(0, 0, 0)");
    const taBorder = await textarea.evaluate((el) => window.getComputedStyle(el).borderTopColor);
    expect(taBorder).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("light: estilo borderless/filled preservado (sem regressão)", async ({ page }) => {
    await ensureTheme(page, "light");

    // Fundo do campo claro (soma dos canais > 600) — nunca preto
    const searchInput = page.getByPlaceholder("Buscar…");
    await expect(searchInput).toBeVisible();
    const { backgroundColor: inputBg, borderLeftColor: inputBorder } = await stylesOf(searchInput, [
      "background-color",
      "border-left-color",
    ]);
    const [r, g, b] = inputBg.match(/\d+/g)!.map(Number);
    expect(r + g + b).toBeGreaterThan(600);

    // Borda transparente no light (estilo filled/borderless mantido)
    expect(inputBorder).toBe("rgba(0, 0, 0, 0)");
  });
});
