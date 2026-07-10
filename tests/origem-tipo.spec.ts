import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `test_origem_${Date.now()}@teste.com`;

test("Tipos de origem marcam recorrência corretamente", async ({ page }) => {
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
  await page.waitForTimeout(1000);

  // 2. Entradas
  await page.goto("/entradas", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // 3. Abre Nova Entrada
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();
  await page.waitForTimeout(1000);

  // 4. Plus button ao lado do Tipo de Origem
  const plusBtn = page.locator("button:has(svg.lucide-plus)").last();
  await expect(plusBtn).toBeVisible({ timeout: 10000 });
  await plusBtn.click();
  await page.waitForTimeout(500);

  // 5. Verifica modal
  await expect(page.getByText("Novo Tipo de Origem")).toBeVisible({ timeout: 5000 });

  // 6. Preenche e cadastra
  await page.locator('input[placeholder="Ex: Cashback"]').fill("Clube Mensal");
  await page.getByRole('checkbox', { name: 'Habilitar recorrência mensal' }).check({ force: true });
  await page.waitForTimeout(300);

  await page.getByRole("button", { name: "Cadastrar" }).click();
  await page.waitForTimeout(2000);

  // 7. Verifica que a recorrência foi ativada (texto informativo + input de meses)
  await expect(page.locator('text=Recorrência ativada pelo tipo de origem selecionado')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('input[placeholder="Ex: 12"]')).toBeVisible({ timeout: 3000 });

  // 8. Fecha e reabre o formulário para garantir que o tipo novo ficou disponível na aba Pontos
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();
  await page.waitForTimeout(700);

  const origemCombobox = page.locator("button[role='combobox']").nth(1);
  await origemCombobox.click();
  await expect(page.getByRole('option', { name: /Clube Mensal/i })).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');

  // 9. Cria um tipo avulso e valida que não ativa recorrência
  await page.locator("button:has(svg.lucide-plus)").last().click();
  await expect(page.getByText("Novo Tipo de Origem")).toBeVisible({ timeout: 5000 });
  await page.locator('input[placeholder="Ex: Cashback"]').fill("Compra Avulsa");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await page.waitForTimeout(1500);

  await expect(page.locator('text=Recorrência ativada pelo tipo de origem selecionado')).not.toBeVisible();
  await expect(page.locator('input[placeholder="Ex: 12"]')).not.toBeVisible();

  // 10. Configurações também exige marcação explícita e persiste como avulsa
  await page.keyboard.press('Escape');
  await page.goto('/configuracoes', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: /tipo de operação/i }).click();
  await page.getByRole('button', { name: /nova operação/i }).click();
  await page.fill('#otName', 'Operação Avulsa Config');
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await expect(page.getByText('Operação Avulsa Config').first()).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Avulsa').first()).toBeVisible({ timeout: 5000 });
});
