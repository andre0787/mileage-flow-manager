import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

/**
 * Testes de Autenticação — MilesControl
 * Cobertura: Login, Cadastro, Recuperação de Senha, Proteção de Rotas
 */

let testEmail: string;
let testPassword = "Test@123456";

test.beforeAll(async ({ browser }) => {
  // Cria um usuário de teste para TC-AUTH-002/003
  const page = await browser.newPage();
  const creds = await registerUser(page);
  testEmail = creds.email;
  await page.close();
});

test.describe("Autenticação", () => {
  test("TC-AUTH-001: Página de login carrega corretamente", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Verifica campos de login
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("TC-AUTH-002: Login com credenciais válidas", async ({ page }) => {
    const email = testEmail;
    const password = testPassword;

    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });

    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("button[type='submit']");

    // Aguarda redirecionamento para dashboard (SPA)
    await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
  });

  test("TC-AUTH-003: Login com senha errada mostra erro inline", async ({ page }) => {
    const email = testEmail;

    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });

    await page.fill("#email", email);
    await page.fill("#password", "senha_errada_123");
    await page.click("button[type='submit']");

    // Aguarda mensagem de erro inline (Login.tsx mostra erro em div text-destructive)
    await page.waitForTimeout(2_000);
    const errorMsg = page.locator(".text-destructive").first();
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });

    // Verifica que permanece na página de login
    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-004: Login com email inexistente mostra erro inline", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });

    await page.fill("#email", "naoexiste@teste.com");
    await page.fill("#password", "qualquer_senha");
    await page.click("button[type='submit']");

    // Aguarda mensagem de erro inline
    await page.waitForTimeout(2_000);
    const errorMsg = page.locator(".text-destructive").first();
    await expect(errorMsg).toBeVisible({ timeout: 10_000 });
  });

  test("TC-AUTH-005: Validação de campos obrigatórios", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 10_000 });

    // Tenta submeter sem preencher
    await page.click("button[type='submit']");

    // Verifica validação HTML5
    const emailInput = page.locator("#email");
    const isValid = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    );
    expect(isValid).toBe(false);
  });

  test("TC-AUTH-006: Acesso a rota protegida redireciona para login", async ({ page }) => {
    // Limpa localStorage para garantir não autenticado
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    // Tenta acessar dashboard
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verifica redirecionamento para login
    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-007: Acesso a /entradas sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/entradas");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-008: Acesso a /vendas sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/vendas");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-009: Acesso a /contas sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/contas");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-010: Acesso a /clientes sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/clientes");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-011: Acesso a /configuracoes sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/configuracoes");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("TC-AUTH-012: Acesso a /relatorios sem login redireciona", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/relatorios");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });
});
