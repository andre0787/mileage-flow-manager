import { test, expect, type Page } from "@playwright/test";
import { registerUser } from "./helpers";

/**
 * Dark Mode — superfícies (dialogs/drawers/forms).
 *
 * Audita os campos editáveis (input/select/textarea) dentro dos principais
 * dialogs do app no dark: Nova Venda, Nova Entrada, Transferir, Nova Conta
 * e Reportar problema (FeedbackDialog). Garante o mesmo tratamento dos
 * filtros (#367): translúcido, sem cinza chapado, texto legível.
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

function rgbaOf(color: string): { r: number; g: number; b: number; a: number } {
  const m = color.match(/[\d.]+/g)!.map(Number);
  return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 };
}

/** Verifica que um campo é legível e consistente no dark (translúcido, sem chapado). */
async function expectFieldLegible(locator: ReturnType<Page["locator"]>, context: string) {
  await locator.first().waitFor({ state: "visible" });
  const count = await locator.count();
  expect(count, `${context}: deve haver campo`).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const styles = await locator.nth(i).evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { bg: cs.backgroundColor, color: cs.color };
    });
    const bg = rgbaOf(styles.bg);
    const sum = bg.r + bg.g + bg.b;
    // Translúcido (alpha < 1) — não chapado sólido
    expect(bg.a, `${context} #${i}: translúcido — got ${styles.bg}`).toBeLessThan(1);
    // Não branco chapado nem preto chapado
    expect(sum, `${context} #${i}: não branco chapado — got ${styles.bg}`).toBeLessThan(650);
    expect(sum, `${context} #${i}: não preto chapado — got ${styles.bg}`).toBeGreaterThan(20);
    // Texto contrasta com o fundo
    const fg = rgbaOf(styles.color);
    const diff = Math.abs(fg.r - bg.r) + Math.abs(fg.g - bg.g) + Math.abs(fg.b - bg.b);
    expect(diff, `${context} #${i}: texto legível`).toBeGreaterThan(100);
  }
}

/** Abre um dialog por nome de botão e audita inputs/selects/textareas internos. */
async function auditDialog(page: Page, buttonName: string, context: string) {
  await page.getByRole("button", { name: buttonName }).first().click({ force: true });
  const dialog = page.locator('[role="dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(400);

  // Só campos de texto — checkbox/radio/hidden/color são transparentes por design
  const textInputs = dialog.locator(
    'input:visible:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="color"]):not([type="submit"]):not([type="button"])',
  );
  await expectFieldLegible(textInputs, `${context} input`);
  await expectFieldLegible(dialog.locator('[role="combobox"]:visible'), `${context} select`);
  const textareas = dialog.locator("textarea:visible");
  if ((await textareas.count()) > 0) {
    await expectFieldLegible(textareas, `${context} textarea`);
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

test.describe("Dark Mode — superfícies (dialogs/forms)", () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page);
    await ensureTheme(page, "dark");
  });

  test("dark: Nova Venda (SaleForm) com campos translúcidos e legíveis", async ({ page }) => {
    await page.goto("/vendas");
    await page.waitForLoadState("networkidle");
    await auditDialog(page, "Nova Venda", "SaleForm");
  });

  test("dark: Nova Entrada (EntryForm) com campos translúcidos e legíveis", async ({ page }) => {
    await page.goto("/entradas");
    await page.waitForLoadState("networkidle");
    await auditDialog(page, "Nova Entrada", "EntryForm");
  });

  test("dark: Transferir (TransferForm) com campos translúcidos e legíveis", async ({ page }) => {
    await page.goto("/entradas");
    await page.waitForLoadState("networkidle");
    await auditDialog(page, "Transferir", "TransferForm");
  });

  test("dark: Nova Conta (AccountDialog) com campos translúcidos e legíveis", async ({ page }) => {
    await page.goto("/contas");
    await page.waitForLoadState("networkidle");
    await auditDialog(page, "Nova Conta", "AccountDialog");
  });
});
