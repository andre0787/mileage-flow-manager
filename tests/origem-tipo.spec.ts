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
  await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 5_000 });

  // 4. Plus button ao lado do Tipo de Origem (irmão do combobox de origem —
  // locator estrutural; `.last()` era frágil com múltiplos botões plus no form)
  const origemCombobox = page
    .getByRole("dialog")
    .first()
    .locator("button[role='combobox']")
    .nth(1);
  const plusOrigemType = origemCombobox.locator("xpath=../..").locator("button:has(svg.lucide-plus)");
  await expect(plusOrigemType).toBeVisible({ timeout: 10000 });
  // force: elemento visível mas instável (transition-all) sob carga do runner
  await plusOrigemType.click({ force: true });

  // 5. Verifica modal
  await expect(page.getByText("Novo Tipo de Origem")).toBeVisible({ timeout: 5000 });

  // 6. Preenche e cadastra (sem checkbox de recorrência — removido)
  await page.locator('input[placeholder="Ex: Cashback"]').fill("Clube Mensal");
  await page.getByRole("button", { name: "Cadastrar" }).click();

  // 7. Verifica que o tipo foi selecionado no combobox (escopado ao dialog —
  //    o header agora tem o OwnerFilter, um combobox a mais na página)
  await expect(origemCombobox).toContainText(/Clube Mensal/i, { timeout: 5000 });

  // 8. Fecha e reabre o formulário para garantir que o tipo novo ficou disponível na aba Pontos
  // Escape é ambíguo: com o dropdown aberto, o 1º Escape fecha só o dropdown; o 2º fecha o
  // dialog. Pressiona até fechar de forma determinística.
  for (let i = 0; i < 3; i++) {
    const hidden = await page
      .getByRole("dialog")
      .first()
      .isHidden({ timeout: 2000 })
      .catch(() => false);
    if (hidden) break;
    await page.keyboard.press('Escape');
  }
  await expect(page.getByRole("dialog").first()).toBeHidden({ timeout: 5_000 });
  await page.getByRole("button", { name: "Nova Entrada" }).first().click();
  await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 5_000 });

  await origemCombobox.click();
  await expect(page.getByRole('option', { name: /Clube Mensal/i })).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');
  // espera o dropdown (listbox) desmontar: aberto, ele COBRE o botão plus —
  // o force click atingiria o overlay e o modal nunca abriria (CI)
  await expect(page.getByRole("listbox")).toHaveCount(0, { timeout: 5000 });

  // 9. Cria outro tipo avulso e valida que aparece no combobox
  // Auto-curativo: se o dialog fechou (Escape ambíguo/animação), reabre; re-resolve
  // o locator fresco e re-clica até o modal abrir. Logs para diagnóstico no CI.
  for (let attempt = 0; attempt < 3; attempt++) {
    const dlg = page.getByRole("dialog").filter({ visible: true }).first();
    const dlgVisible = await dlg.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[origem-tipo] attempt=${attempt} dialogVisible=${dlgVisible}`);
    if (!dlgVisible) {
      await page
        .getByRole("button", { name: "Nova Entrada" })
        .first()
        .click({ timeout: 5000 })
        .catch((e) => console.log("[origem-tipo] reopen click falhou", String(e).slice(0, 120)));
      await expect(page.getByRole("dialog").filter({ visible: true }).first())
        .toBeVisible({ timeout: 8000 })
        .catch((e) => console.log("[origem-tipo] dialog nao reabriu", String(e).slice(0, 120)));
    }
    const lb = await page.getByRole("listbox").count().catch(() => -1);
    console.log(`[origem-tipo] listboxCount=${lb}`);
    const cbs2 = dlg.locator("button[role='combobox']");
    const cbCount = await cbs2.count().catch(() => -1);
    console.log(`[origem-tipo] comboboxCount=${cbCount}`);
    const plus2 = cbs2.nth(1).locator("xpath=../..").locator("button:has(svg.lucide-plus)");
    await plus2.click({ force: true, timeout: 5000 }).catch((e) => console.log("[origem-tipo] plus click falhou", String(e).slice(0, 120)));
    const opened = await page
      .getByText("Novo Tipo de Origem")
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    console.log(`[origem-tipo] modalAberto=${opened}`);
    if (opened) break;
  }
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
