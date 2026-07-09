import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";

test.describe("Edição de Entradas", () => {
  const email = `test_e2e_${Date.now()}@teste.com`;

  test("Fluxo completo: criar, editar e excluir entrada", async ({ page }) => {
    // ═══════════════════════════════════════
    // 1. Registrar novo usuário
    // ═══════════════════════════════════════
    await page.goto("/login");
    await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5_000 });

    await page.fill("#name", "Usuário Teste E2E");
    await page.fill("#email", email);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type='submit']");

    // Aguarda dashboard
    await page.waitForURL("/", { timeout: 30_000 });
    await page.waitForTimeout(1_000);

    // ═══════════════════════════════════════
    // 2. Criar dados de teste via Supabase JS client
    // ═══════════════════════════════════════
    const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
    const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

    const testData = await page.evaluate(async ({ url, anonKey }) => {
      const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
      if (!sessionStr) throw new Error('Sessão não encontrada no localStorage');
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
      const accountId = crypto.randomUUID();
      const entryId = crypto.randomUUID();

      // Cria owner
      const ownerRes = await fetch(`${url}/rest/v1/owners`, {
        method: 'POST', headers,
        body: JSON.stringify({ id: ownerId, user_id: userId, name: 'Dono Teste', cpf: '123.456.789-00', phone: '(11) 99999-8888' }),
      });
      if (!ownerRes.ok) throw new Error('Falha ao criar owner: ' + await ownerRes.text());

      // Cria program (necessário para FK accounts_program_id_fkey)
      const progRes = await fetch(`${url}/rest/v1/programs`, {
        method: 'POST', headers,
        body: JSON.stringify({ id: programId, user_id: userId, name: 'Programa Teste', type: 'milhas' }),
      });
      if (!progRes.ok) throw new Error('Falha ao criar program: ' + await progRes.text());

      // Cria origem_type (FK alternativo para entries)
      const otRes = await fetch(`${url}/rest/v1/origem_types`, {
        method: 'POST', headers,
        body: JSON.stringify({ id: otId, user_id: userId, name: 'Programa Teste', account_type: 'milhas', color: '#10b981', description: '{"hasRecurrence":false}' }),
      });
      if (!otRes.ok) throw new Error('Falha ao criar origem_type: ' + await otRes.text());

      // Cria conta
      const accRes = await fetch(`${url}/rest/v1/accounts`, {
        method: 'POST', headers,
        body: JSON.stringify({
          id: accountId, user_id: userId, owner_id: ownerId, program_id: programId,
          name: 'Conta Teste', type: 'milhas', balance: 50000, total_invested: 3500,
          average_cost_per_mile: 0.07, status: 'ativa',
        }),
      });
      if (!accRes.ok) throw new Error('Falha ao criar conta: ' + await accRes.text());

      // Cria entrada
      const entryRes = await fetch(`${url}/rest/v1/entries`, {
        method: 'POST', headers,
        body: JSON.stringify({
          id: entryId, user_id: userId, account_id: accountId, origem_type_id: otId,
          amount: 50000, amount_paid: 3500, cost_per_thousand: 70,
          cost_per_mile: 0.07, date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!entryRes.ok) throw new Error('Falha ao criar entrada: ' + await entryRes.text());

      return { entryId, accountId };
    }, { url: supabaseUrl, anonKey: supabaseAnonKey });

    // ═══════════════════════════════════════
    // 3. Verificar entrada na UI
    // ═══════════════════════════════════════
    await page.goto("/entradas");
    await page.waitForSelector("text=Entradas", { timeout: 15_000 });
    await page.waitForTimeout(500);

    // Alterna para aba Milhas
    await page.locator("button[role='tab']:has-text('Milhas')").click();
    await page.waitForTimeout(500);

    // Verifica entrada na tabela
    await expect(page.locator("text=50.000").first()).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 4. Clicar em Editar
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Editar')").first().click();
    await page.waitForTimeout(1_000);

    // Verifica que o drawer de edição abriu
    await expect(page.locator("text=Editar Entrada")).toBeVisible({ timeout: 3_000 });

    // ═══════════════════════════════════════
    // 5. Alterar valores e salvar
    // ═══════════════════════════════════════
    await page.fill("#amount", "75000");
    await page.fill("#amountPaid", "5000.00");
    await page.waitForTimeout(500);

    // Salva
    await page.locator("button:has-text('Salvar Alterações')").click({ force: true });
    await page.waitForTimeout(2_500);

    // Verifica valores atualizados
    await expect(page.locator("text=75.000").first()).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 6. Excluir entrada
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Excluir')").first().click();
    await page.waitForTimeout(1_000);

    // Confirma exclusão no AlertDialog
    await page.locator("div[role='alertdialog'] button:has-text('Excluir')").click({ force: true });
    await page.waitForTimeout(2_500);

    // Verifica que a entrada foi removida
    await expect(page.locator("text=75.000").first()).not.toBeVisible();
  });
});
