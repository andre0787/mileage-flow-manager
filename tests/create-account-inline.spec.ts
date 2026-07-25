import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test("Criação inline de conta ao registrar entrada", async ({ page }) => {
  const email = `test_create_account_${Date.now()}@teste.com`;

  // 1. Registrar novo usuário
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });

  await page.fill("#name", "Usuário Teste E2E");
  await page.fill("#email", email);
  await page.fill("#password", TEST_PASSWORD);
  await page.click("button[type='submit']");

  // Aguarda dashboard
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // 2. Criar dados de teste (owner + program) via API
  const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
  const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

  const { ownerId, programId, otId } = await page.evaluate(async ({ url, anonKey }) => {
    const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
    if (!sessionStr) throw new Error('Sessão não encontrada');
    const session = JSON.parse(sessionStr);
    const accessToken = session.access_token;
    const userId = session.user.id;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${accessToken}`,
    };

    const ownerId = crypto.randomUUID();
    const programId = crypto.randomUUID();
    const otId = crypto.randomUUID();

    const ownerRes = await fetch(`${url}/rest/v1/owners`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: ownerId, user_id: userId, name: 'Dono Teste Inline', cpf: '123.456.789-00', phone: '(11) 99999-8888' }),
    });
    if (!ownerRes.ok) throw new Error('Falha ao criar owner: ' + await ownerRes.text());

    const progRes = await fetch(`${url}/rest/v1/programs`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: programId, user_id: userId, name: 'Programa Teste Inline', type: 'milhas' }),
    });
    if (!progRes.ok) throw new Error('Falha ao criar program: ' + await progRes.text());

    const otRes = await fetch(`${url}/rest/v1/origem_types`, {
      method: 'POST', headers,
      body: JSON.stringify({ id: otId, user_id: userId, name: 'Compra Direta', account_type: 'milhas', color: '#10b981', description: '{"hasRecurrence":false}' }),
    });
    if (!otRes.ok) throw new Error('Falha ao criar origem_type: ' + await otRes.text());

    return { ownerId, programId, otId };
  }, { url: supabaseUrl, anonKey: supabaseAnonKey });

  // 3. Navegar para Entradas
  await page.goto("/entradas");
  await page.waitForSelector("text=Entradas", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // Alterna para aba Milhas
  await page.locator("button[role='tab']:has-text('Milhas')").click();
  await expect(page.locator("button[role='tab'][aria-selected='true']:has-text('Milhas')")).toBeVisible({ timeout: 5_000 });

  // 4. Clicar em "Nova Entrada"
  await page.getByRole('button', { name: 'Nova Entrada' }).first().click();

  const entryDrawer = page.getByRole('dialog').first();
  await expect(entryDrawer).toBeVisible({ timeout: 5_000 });

  // 5. Clicar no botão "+" de Conta (primeiro botão + dentro do drawer)
  await entryDrawer.locator('button[data-lov-name="Button"] svg.lucide-plus').first().click();

  // 6. Preencher o formulário de Nova Conta
  // O FormDrawer de Nova Conta abre dentro do EntryForm, os campos estão visíveis
  await expect(page.getByText('Nome da Conta')).toBeVisible({ timeout: 3_000 });

  // Preenche nome da conta
  const accountNameInput = page.getByPlaceholder('Ex: Conta Principal LATAM');
  await accountNameInput.fill('Conta Criada Inline');

  // Seleciona dono - clica no select com placeholder "Selecione o dono"
  await page.getByText('Selecione o dono').click();
  await page.getByRole('option', { name: 'Dono Teste Inline' }).click();

  // Seleciona programa
  await page.getByText('Selecione o programa').click();
  await page.getByRole('option', { name: 'Programa Teste Inline' }).click();

  // Verifica que o tipo foi derivado
  await expect(page.getByText('Tipo da conta: Milhas')).toBeVisible({ timeout: 3_000 });

  // 7. Clicar em "Cadastrar"
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  // 8. Verificar que a conta foi auto-selecionada
  await expect(entryDrawer.getByText('Conta Criada Inline')).toBeVisible({ timeout: 5_000 });

  // 9. Preencher restante da entrada
  await page.fill("#entryDate", new Date().toISOString().split("T")[0]);

  // Tipo de Origem
  await page.getByText('Selecione o tipo').click();
  await page.getByRole('option', { name: 'Compra Direta' }).click();

  // Quantidade e valor
  await page.fill("#amount", "25000");
  await page.fill("#amountPaid", "1500.00");

  // 10. Salvar
  await entryDrawer.getByRole('button', { name: 'Registrar Entrada' }).click();

  // 11. Verificar entrada na tabela
  await expect(page.getByText('25.000').first()).toBeVisible({ timeout: 5_000 });

  // 12. Verificar conta criada na página de contas
  await page.goto("/contas");
  await page.waitForSelector("text=Contas", { timeout: 15_000 });
  await expect(page.getByText('Conta Criada Inline')).toBeVisible({ timeout: 5_000 });
});
