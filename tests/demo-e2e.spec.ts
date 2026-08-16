import { test, expect } from "@playwright/test";

// O demo só existe quando o dev server roda com VITE_PUBLIC_DEMO_ENABLED=true
// (npm run test:e2e:demo). Em test:e2e padrão, o spec é pulado (skip), nunca
// falha — preserva o gate local e o CI (que roda --grep "Smoke Tests").
test.skip(
  !process.env.VITE_PUBLIC_DEMO_ENABLED,
  "demo exige VITE_PUBLIC_DEMO_ENABLED=true (npm run test:e2e:demo)",
);

/**
 * demo-e2e.spec.ts — E2E real do Demo anônimo (P12.5-02/03/06).
 *
 * Roda o cenário `create-mileage-entry` do Scenario Registry contra o demo
 * real (rota /demo, sem login). Requer VITE_PUBLIC_DEMO_ENABLED=true no
 * servidor local (ver package.json test:e2e:demo).
 *
 * Este spec NÃO roda no CI por padrão (CI roda --grep "Smoke Tests").
 */

test.describe("Public Demo — cenário create-mileage-entry", () => {
  test("anon acessa /demo sem login e vê o dashboard da fixture", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Não redireciona para /login (acesso anônimo, P12.5-02)
    expect(page.url()).toContain("/demo");

    // Tenant __demo__ + total da fixture determinística (P12.5-01/03)
    await expect(page.locator("#dashboard-total")).toHaveText("41.400");
    await expect(page.locator("#entry-list tbody tr")).toHaveCount(3);
  });

  test("cria entrada de milhas e o total do dashboard muda", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await page.selectOption("#program", "Smiles");
    await page.fill("#miles", "1500");
    await page.fill("#description", "Demo compra e2e");
    await page.click("#submit-entry");

    // Entry aparece + total muda (41.400 + 1.500 = 42.900)
    await expect(page.locator("#entry-list tbody tr")).toHaveCount(4);
    await expect(page.locator("#dashboard-total")).toHaveText("42.900");
    await expect(page.locator("#entry-list")).toContainText("Demo compra e2e");
  });

  test("validação rejeita milhas inválidas sem criar entrada", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    await page.fill("#miles", "-5");
    await page.click("#submit-entry");

    await expect(page.locator("#validation-error")).toHaveText("milhas inválidas");
    await expect(page.locator("#entry-list tbody tr")).toHaveCount(3);
  });

  test("reset restaura o fixture determinístico (P12.5-03)", async ({ page }) => {
    await page.goto("/demo");
    await page.waitForLoadState("networkidle");

    // Muta o dataset
    await page.selectOption("#program", "Smiles");
    await page.fill("#miles", "1500");
    await page.click("#submit-entry");
    await expect(page.locator("#entry-list tbody tr")).toHaveCount(4);

    // Reset → baseline
    await page.click("#reset-demo");
    await expect(page.locator("#entry-list tbody tr")).toHaveCount(3);
    await expect(page.locator("#dashboard-total")).toHaveText("41.400");
  });
});
