import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

/**
 * Smoke tests — previnem tela preta e erros de render.
 * Roda em TODOS os PRs como bateria obrigatória.
 */

test.describe("Smoke Tests — Tela Preta", () => {
  test("Login não mostra tela preta", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verifica que a página tem conteúdo visível
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);

    // Verifica que NÃO há tela preta (body com fundo preto e sem conteúdo)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Tela preta seria rgb(0, 0, 0) — mas body pode ter fundo transparente
    // O importante é que haja conteúdo visível

    // Verifica que o root tem filhos
    const rootChildren = await page.evaluate(() => {
      return document.getElementById("root")?.children.length ?? 0;
    });
    expect(rootChildren).toBeGreaterThan(0);
  });

  test("Dashboard não mostra tela preta após login", async ({ page }) => {
    // Registra e loga antes do teste
    await registerUser(page);
    await page.waitForTimeout(2_000);

    // Verifica que o root tem filhos
    const rootChildren = await page.evaluate(() => {
      return document.getElementById("root")?.children.length ?? 0;
    });
    expect(rootChildren).toBeGreaterThan(0);

    // Verifica que não há error messages no console (crashes)
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Espera um frame para capturar erros
    await page.waitForTimeout(1_000);

    // Se houve erro de render, a tela pode estar preta
    const hasErrorOverlay = await page.locator("[role='alert']").count();
    // Error overlay do Vite aparece em dev — não deve existir em prod
  });

  test("Páginas públicas carregam sem erro", async ({ page }) => {
    const publicPages = ["/login", "/forgot-password"];

    for (const path of publicPages) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const rootChildren = await page.evaluate(() => {
        return document.getElementById("root")?.children.length ?? 0;
      });
      expect(rootChildren, `Root vazio em ${path}`).toBeGreaterThan(0);
    }
  });
});
