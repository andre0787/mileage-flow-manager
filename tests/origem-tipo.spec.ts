import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `test_origem_${Date.now()}@teste.com`;

test("Tipos de origem são criados e listados corretamente", async ({ page }) => {
  test.setTimeout(60000);

  // 1. Registrar
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Cadastre-se", { timeout: 15000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5000 });

  await page.fill("#name", "Teste");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30000 });
  await page.waitForLoadState("networkidle");

  // 2. Entradas
  await page.goto("/entradas", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");

  // 3. Abre Nova Entrada
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();
  await expect(page.getByText("Nova Entrada")).toBeVisible({ timeout: 5_000 });

  // 4. Plus button ao lado do Tipo de Origem
  const plusBtn = page.locator("button:has(svg.lucide-plus)").last();
  await expect(plusBtn).toBeVisible({ timeout: 10000 });
  await plusBtn.click();

  // 5. Verifica modal
  await expect(page.getByText("Novo Tipo de Origem")).toBeVisible({ timeout: 5000 });

  // 6. Preenche e cadastra (sem checkbox de recorrência — removido)
  await page.locator('input[placeholder="Ex: Cashback"]').fill("Clube Mensal");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  // 7. Verifica que o tipo foi selecionado no combobox
  const origemCombobox = page.locator("button[role='combobox']").nth(1);
  await expect(origemCombobox).toContainText(/Clube Mensal/i, { timeout: 5000 });

  // 8. Fecha e reabre o formulário para garantir que o tipo novo ficou disponível na aba Pontos
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300); // ponytail: dialog close animation
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();
  await expect(page.getByText("Nova Entrada")).toBeVisible({ timeout: 5_000 });

  await origemCombobox.click();
  await expect(page.getByRole('option', { name: /Clube Mensal/i })).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');

  // 9. Cria outro tipo avulso e valida que aparece no combobox
  await page.locator("button:has(svg.lucide-plus)").last().click();
  await expect(page.getByText("Novo Tipo de Origem")).toBeVisible({ timeout: 5000 });
  await page.locator('input[placeholder="Ex: Cashback"]').fill("Compra Avulsa");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  // Verifica que o novo tipo está no combobox
  await origemCombobox.click();
  await expect(page.getByRole('option', { name: /Compra Avulsa/i })).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');

  // 10. Verifica que os tipos aparecem em Configurações
  await page.keyboard.press('Escape');
  await page.goto('/configuracoes', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: /tipo de operação/i }).click();
  await page.getByRole('button', { name: /nova operação/i }).click();
  await page.fill('#otName', 'Operação Avulsa Config');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page.getByText('Operação Avulsa Config').first()).toBeVisible({ timeout: 5000 });
});
