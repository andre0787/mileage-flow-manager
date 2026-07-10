import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `test_clube_${Date.now()}@teste.com`;

test.describe("Clube de Milhas", () => {
  test("Fluxo: criar entrada com recorrência, ver badges, confirmar pendente", async ({ page }) => {
    // ═══════════════════════════════════════
    // 1. Registrar usuário
    // ═══════════════════════════════════════
    await page.goto("/login");
    await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5_000 });

    await page.fill("#name", "Usuário Clube E2E");
    await page.fill("#email", email);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type='submit']");

    await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
    await page.waitForTimeout(1_000);

    // ═══════════════════════════════════════
    // 2. Criar dados via API
    // ═══════════════════════════════════════
    const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
    const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

    const { ownerId, programId, accountId, otId } = await page.evaluate(async ({ url, anonKey }) => {
      const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
      if (!sessionStr) throw new Error('Sessão não encontrada');
      const session = JSON.parse(sessionStr);
      const token = session.access_token;
      const userId = session.user.id;

      const headers = {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${token}`,
      };

      async function post(table: string, body: Record<string, unknown>) {
        await fetch(`${url}/rest/v1/${table}`, {
          method: 'POST', headers,
          body: JSON.stringify({ ...body, user_id: userId }),
        });
      }

      const ownerId = crypto.randomUUID();
      const programId = crypto.randomUUID();
      const accountId = crypto.randomUUID();
      const otId = crypto.randomUUID();

      await post('owners', { id: ownerId, name: 'Dono Clube' });
      await post('programs', { id: programId, name: 'Programa Milhas', type: 'milhas' });
      // Origem tipo com hasRecurrence: true → ativa recorrência automaticamente
      await post('origem_types', {
        id: otId, name: 'Clube Fidelidade', account_type: 'milhas', color: '#f59e0b',
        description: JSON.stringify({ hasRecurrence: true }),
      });
      await post('accounts', {
        id: accountId, owner_id: ownerId, program_id: programId, name: 'Conta Milhas',
        type: 'milhas', balance: 0, total_invested: 0, average_cost_per_mile: 0, status: 'ativa',
      });

      return { ownerId, programId, accountId, otId };
    }, { url: supabaseUrl, anonKey: supabaseAnonKey });

    // ═══════════════════════════════════════
    // 3. Criar entrada com Clube via UI
    // ═══════════════════════════════════════
    await page.goto("/entradas");
    await page.waitForSelector("text=Entradas", { timeout: 15_000 });
    await page.waitForTimeout(1_000);

    // Ir para aba Milhas (conta é do tipo milhas)
    await page.getByRole("tab", { name: /milhas/i }).click();
    await page.waitForTimeout(500);

    // Abrir dialog de nova entrada
    await page.locator("button:has-text('Nova Entrada')").first().click();
    await page.waitForTimeout(500);

    // Preencher formulário — selecionar conta
    await page.locator("button[role='combobox']").first().click();
    await page.waitForTimeout(300);
    await page.locator("text=Conta Milhas").click();

    // Selecionar tipo de origem com recorrência
    await page.locator("button[role='combobox']").nth(1).click();
    await page.waitForTimeout(300);
    await page.locator("text=Clube Fidelidade").click();
    await page.waitForTimeout(500);

    // Recorrência ativada automaticamente → seção "meses" aparece
    await expect(page.locator("text=Recorrência ativada pelo tipo de origem selecionado")).toBeVisible({ timeout: 3_000 });

    await page.fill("#amount", "10000");
    await page.fill("#amountPaid", "350.00");

    // Preencher meses
    await page.fill("input[placeholder='Ex: 12']", "3");

    // Verificar preview
    await expect(page.locator("text=Aguardando").first()).toBeVisible({ timeout: 3_000 });

    // Registrar
    await page.locator("button:has-text('Registrar Entrada')").click();
    await page.waitForTimeout(2_000);

    // ═══════════════════════════════════════
    // 4. Verificar badges
    // ═══════════════════════════════════════
    await expect(page.locator("text=🔄 Clube").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=⏳ Aguardando").first()).toBeVisible({ timeout: 3_000 });
    await expect(page.locator("text=3 entrada(s) pendente(s)").first()).toBeVisible({ timeout: 3_000 });

    // ═══════════════════════════════════════
    // 5. Confirmar entrada pendente
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Confirmar')").first().click();
    await page.waitForTimeout(1_500);

    // ═══════════════════════════════════════
    // 6. Dashboard banner
    // ═══════════════════════════════════════
    await page.goto("/");
    await page.waitForTimeout(1_000);
    await expect(page.locator("text=pendente(s) de confirmação").first()).toBeVisible({ timeout: 5_000 });
  });
});
