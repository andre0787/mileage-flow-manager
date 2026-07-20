import { test, expect } from "@playwright/test";

const TEST_PASSWORD = "Test@123456";
const email = `test_carrinho_${Date.now()}@teste.com`;

test.describe("Transferência com Compra no Carrinho", () => {
  test("Fluxo: criar transferencia com carrinho, verificar badge, editar, excluir", async ({ page }) => {
    // ═══════════════════════════════════════
    // 1. Registrar usuário
    // ═══════════════════════════════════════
    await page.goto("/login");
    await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
    await page.click("text=Cadastre-se");
    await page.waitForSelector("#name", { timeout: 5_000 });

    await page.fill("#name", "Usuário Carrinho E2E");
    await page.fill("#email", email);
    await page.fill("#password", TEST_PASSWORD);
    await page.click("button[type='submit']");

    await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");

    // ═══════════════════════════════════════
    // 2. Criar dados + entrada com carrinho via API
    // ═══════════════════════════════════════
    const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
    const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

    await page.evaluate(async ({ url, anonKey }) => {
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
        const res = await fetch(`${url}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify({ ...body, user_id: userId }) });
        if (!res.ok) {
          const t = await res.text();
          if (t.includes('duplicate key')) return;
          throw new Error(`Falha ao criar ${table}: ${t}`);
        }
      }

      // Find or create Transferência origem_type
      const search = await fetch(`${url}/rest/v1/origem_types?name=eq.Transferência&user_id=eq.${userId}&select=id`, { headers });
      let transferId: string;
      if (search.ok) {
        const data = await search.json();
        if (data && data.length > 0) {
          transferId = data[0].id;
        } else {
          transferId = crypto.randomUUID();
          await post('origem_types', { id: transferId, name: 'Transferência', account_type: 'milhas', color: '#8b5cf6', description: JSON.stringify({ hasRecurrence: false }) });
        }
      } else {
        transferId = crypto.randomUUID();
        await post('origem_types', { id: transferId, name: 'Transferência', account_type: 'milhas', color: '#8b5cf6', description: JSON.stringify({ hasRecurrence: false }) });
      }

      const ownerId = crypto.randomUUID();
      const programPontosId = crypto.randomUUID();
      const programMilhasId = crypto.randomUUID();
      const aidPt = crypto.randomUUID();
      const aidMi = crypto.randomUUID();
      const eid = crypto.randomUUID();

      await post('owners', { id: ownerId, name: 'Dono Carrinho', cpf: '111.222.333-44' });
      await post('programs', { id: programPontosId, name: 'Programa Pontos', type: 'pontos', max_passengers: 9, passenger_cycle_type: 'anual', passenger_cycle_days: 365 });
      await post('programs', { id: programMilhasId, name: 'Programa Milhas', type: 'milhas', max_passengers: 9, passenger_cycle_type: 'anual', passenger_cycle_days: 365 });
      await post('accounts', { id: aidPt, owner_id: ownerId, program_id: programPontosId, name: 'Conta Pontos', type: 'pontos', balance: 100000, total_invested: 5000, average_cost_per_mile: 0.05, status: 'ativa' });
      await post('accounts', { id: aidMi, owner_id: ownerId, program_id: programMilhasId, name: 'Conta Milhas', type: 'milhas', balance: 0, total_invested: 0, average_cost_per_mile: 0, status: 'ativa' });

      // Create entry with cart (50K transfer + 10K cart, 30% bonus)
      await post('entries', {
        id: eid, account_id: aidMi, origem_type_id: transferId,
        amount: 50000, amount_paid: 2700, cost_per_thousand: 34.615,
        conversion_rate: 1.3, miles_generated: 78000,
        cost_per_mile: 0.0346,
        source_account_id: aidPt, bonus_percent: 30,
        description: JSON.stringify({ cartAmount: 10000, cartCost: 200 }),
        date: new Date().toISOString().split('T')[0],
      });
    }, { url: supabaseUrl, anonKey: supabaseAnonKey });

    // ═══════════════════════════════════════
    // 3. Verificar entrada no UI
    // ═══════════════════════════════════════
    await page.goto("/entradas");
    await page.waitForSelector("text=Entradas", { timeout: 15_000 });

    await page.locator("button[role='tab']:has-text('Milhas')").click();
    await expect(page.locator("button[role='tab'][aria-selected='true']:has-text('Milhas')")).toBeVisible({ timeout: 5_000 });

    // Use .first() since 50.000 may appear in multiple cells
    await expect(page.locator("text=50.000").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("text=🛒 Carrinho").first()).toBeVisible({ timeout: 3_000 });

    // ═══════════════════════════════════════
    // 4. Editar e verificar seção carrinho
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Editar')").first().click();
    await expect(page.locator("text=Editar Entrada")).toBeVisible({ timeout: 5_000 });

    await expect(page.locator("text=Compra no Carrinho").first()).toBeVisible({ timeout: 2_000 });

    await page.locator("button:has-text('Salvar Alterações')").click({ force: true });
    await expect(page.getByRole('heading', { level: 1, name: 'Entradas', exact: true })).toBeVisible({ timeout: 5_000 });

    await expect(page.getByRole('heading', { level: 1, name: 'Entradas', exact: true })).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 5. Excluir
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Excluir')").first().click();
    await expect(page.locator("div[role='alertdialog']")).toBeVisible({ timeout: 5_000 });

    await page.locator("div[role='alertdialog'] button:has-text('Excluir')").click({ force: true });
  });
});
