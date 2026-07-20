import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `test_clube_${Date.now()}@teste.com`;

test.describe("Recorrência", () => {
  test("Fluxo: criar entrada com recorrência manual, ver badges, confirmar pendente", async ({ page }) => {
    // ═══════════════════════════════════════
    // 1. Registrar usuário
    // ═══════════════════════════════════════
    await page.goto("/login");
    await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5_000 });

    await page.fill("#name", "Usuário Rec E2E");
    await page.fill("#email", email);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type='submit']");

    await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");

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

      await post('owners', { id: ownerId, name: 'Dono Recorrência' });
      await post('programs', { id: programId, name: 'Programa Milhas', type: 'milhas' });
      // Origem tipo sem hasRecurrence — recorrência é manual
      await post('origem_types', {
        id: otId, name: 'Clube Fidelidade', account_type: 'milhas', color: '#f59e0b',
      });
      await post('accounts', {
        id: accountId, owner_id: ownerId, program_id: programId, name: 'Conta Milhas',
        type: 'milhas', balance: 0, total_invested: 0, average_cost_per_mile: 0, status: 'ativa',
      });

      return { ownerId, programId, accountId, otId };
    }, { url: supabaseUrl, anonKey: supabaseAnonKey });

    // ═══════════════════════════════════════
    // 3. Criar entrada com recorrência manual via UI
    // ═══════════════════════════════════════
    await page.goto("/entradas");
    await page.waitForSelector("text=Entradas", { timeout: 15_000 });

    // Ir para aba Milhas (conta é do tipo milhas)
    await page.getByRole("tab", { name: /milhas/i }).click();
    await expect(page.locator("button[role='tab'][aria-selected='true']:has-text('Milhas')")).toBeVisible({ timeout: 5_000 });

    // Abrir dialog de nova entrada
    await page.locator("button:has-text('Nova Entrada')").first().click();
    await expect(page.getByText("Nova Entrada")).toBeVisible({ timeout: 5_000 });

    // Preencher formulário — selecionar conta
    await page.locator("button[role='combobox']").first().click();
    await expect(page.getByRole("option", { name: /conta milhas/i })).toBeVisible({ timeout: 3_000 });
    await page.locator("text=Conta Milhas").click();

    // Selecionar tipo de origem
    await page.locator("button[role='combobox']").nth(1).click();
    await expect(page.getByRole("option", { name: /clube fidelidade/i })).toBeVisible({ timeout: 3_000 });
    await page.locator("text=Clube Fidelidade").click();

    await page.fill("#amount", "10000");
    await page.fill("#amountPaid", "350.00");
    await page.fill("#entryDate", new Date().toISOString().split("T")[0]);

    // Habilitar recorrência manual
    await page.locator('input[type="checkbox"]').first().check({ force: true });

    // Configurar recorrência: 3 parcelas, data de início
    const parcelasInput = page.getByText('Quantidade de parcelas').locator('..').locator('input[type="number"]');
    await parcelasInput.fill('3');
    const inicioInput = page.getByText('Data de início').locator('..').locator('input[type="date"]');
    await inicioInput.fill(new Date().toISOString().split('T')[0]);

    // Registrar
    await page.locator("button:has-text('Registrar Entrada')").click();

    // ═══════════════════════════════════════
    // 4. Verificar badges
    // ═══════════════════════════════════════
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=⏳ Aguardando").first()).toBeVisible({ timeout: 10_000 });

    // ═══════════════════════════════════════
    // 5. Confirmar entrada pendente
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Confirmar')").first().click();

    // ═══════════════════════════════════════
    // 6. Dashboard banner
    // ═══════════════════════════════════════
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=pendente(s) de confirmação").first()).toBeVisible({ timeout: 5_000 });
  });
});
