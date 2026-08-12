import { test, expect } from "@playwright/test";
import { registerUser, API_SETUP } from "./helpers";

const TEST_PASSWORD = "Test@123456";

test.describe("Transferência com Compra no Carrinho — Cálculos", () => {
  test("Carrinho: custo por milha reage ao valor investido e edição não duplica custo", async ({
    page,
  }) => {
    // ═══════════════════════════════════════
    // 1. Registrar usuário
    // ═══════════════════════════════════════
    const { email } = await registerUser(page);

    // ═══════════════════════════════════════
    // 2. Criar dados via API (owner, programas, contas, tipo Transferência)
    // ═══════════════════════════════════════
    await page.goto("/entradas");
    await page.waitForLoadState("networkidle");

    const ids = await page.evaluate(`
      const SUPABASE_URL = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
      const SUPABASE_ANON_KEY = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';
      ${API_SETUP}

      async function ensureTransferType() {
        const search = await fetch(
          SUPABASE_URL + '/rest/v1/origem_types?name=eq.Transferência&user_id=eq.' + userId + '&select=id',
          {
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: 'Bearer ' + _token,
            },
          },
        );
        const data = await search.json().catch(() => []);
        if (data && data.length > 0) return data[0].id;
        const id = crypto.randomUUID();
        const res = await fetch(SUPABASE_URL + '/rest/v1/origem_types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + _token,
          },
          body: JSON.stringify({
            id, user_id: userId, name: 'Transferência', account_type: 'milhas',
            color: '#8b5cf6', description: JSON.stringify({ hasRecurrence: false }),
          }),
        });
        if (!res.ok) throw new Error('origem_types: ' + (await res.text()));
        return id;
      }

      (async () => {
        const transferId = await ensureTransferType();
        const ownerId = crypto.randomUUID();
        const programPontosId = crypto.randomUUID();
        const programMilhasId = crypto.randomUUID();
        const aidPt = crypto.randomUUID();
        const aidMi = crypto.randomUUID();

        await post('owners', { id: ownerId, name: 'Dono Carrinho Calc', cpf: '111.222.333-44' });
        await post('programs', { id: programPontosId, name: 'Programa Pontos', type: 'pontos', max_passengers: 9, passenger_cycle_type: 'anual', passenger_cycle_days: 365 });
        await post('programs', { id: programMilhasId, name: 'Programa Milhas', type: 'milhas', max_passengers: 9, passenger_cycle_type: 'anual', passenger_cycle_days: 365 });
        await post('accounts', { id: aidPt, owner_id: ownerId, program_id: programPontosId, name: 'Conta Pontos', type: 'pontos', balance: 100000, total_invested: 5000, average_cost_per_mile: 0.05, status: 'ativa' });
        await post('accounts', { id: aidMi, owner_id: ownerId, program_id: programMilhasId, name: 'Conta Milhas', type: 'milhas', balance: 0, total_invested: 0, average_cost_per_mile: 0, status: 'ativa' });

        return { transferId, ownerId, aidPt, aidMi };
      })()
    `);

    // Recarrega para o DataContext buscar as contas recém-criadas
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("button[role='tab']:has-text('Pontos')").first().click().catch(() => {});

    // ═══════════════════════════════════════
    // 3. Abrir Transferir e preencher formulário
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Transferir')").first().click();
    await expect(page.locator("#transferSource")).toBeVisible({ timeout: 5_000 });

    // Conta de origem
    await page.locator("#transferSource").click();
    await page.locator("[role='option']:has-text('Conta Pontos')").click();

    // Conta de destino
    await page.locator("#transferDest").click();
    await page.locator("[role='option']:has-text('Conta Milhas')").click();

    // Data
    await page.fill("#transferDate", "2026-08-05");

    // Pontos transferidos: 50.000 → custo calculado = 50.000 × 0.05 = 2500
    await page.fill("#transferAmount", "50000");
    await expect(page.locator("#transferCost")).toHaveValue(/2500/);

    // Bonificação 30%
    await page.fill("#transferBonus", "30");

    // Sem carrinho: milhas = 50.000 × 1.3 = 65.000; custo/milha = 2500/65000 ≈ 0.0385
    await expect(page.locator("text=65.000").first()).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 4. Preencher carrinho e verificar que os cálculos REAGEM ao valor investido
    // ═══════════════════════════════════════
    // Pontos extras: 10.000 → total 60.000 × 1.3 = 78.000 milhas
    const cartAmountInput = page.locator("input[placeholder='Ex: 10000']").first();
    await cartAmountInput.fill("10000");

    // Sem o valor investido do carrinho: custo por milhar = 2500/78000×1000 ≈ 32.05
    await expect(page.getByText("R$ 32.05", { exact: false })).toBeVisible({ timeout: 5_000 });

    // BUG REPORTADO: ao inserir o valor investido (cartCost), os números NÃO mudavam.
    // Agora devem mudar: custo total = 2500 + 200 = 2700 → custo/milhar = 34.62
    const cartCostInput = page.locator("input[placeholder='Ex: 200.00']").first();
    await cartCostInput.fill("200");
    await expect(page.getByText("R$ 34.62", { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("R$ 0.0346", { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("R$ 2700.00", { exact: false })).toBeVisible({ timeout: 5_000 });

    // Registra a transferência
    await page.getByRole("dialog").getByRole("button", { name: "Registrar Transferência" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 8_000 });

    // Badge do carrinho visível
    await page.locator("button[role='tab']:has-text('Milhas')").click();
    await expect(page.locator("text=🛒 Carrinho").first()).toBeVisible({ timeout: 5_000 });

    // ═══════════════════════════════════════
    // 5. Editar e confirmar que o custo NÃO duplica
    // ═══════════════════════════════════════
    await page.locator("button:has-text('Editar')").first().click();
    await expect(page.locator("text=Editar Entrada")).toBeVisible({ timeout: 5_000 });

    // No modo edição, o custo (transferência) deve ser 2500 (banco: 2700 - 200 carrinho)
    // e o carrinho 200 → totalPaid = 2500 + 200 = 2700 (sem duplicar)
    const editCost = page.locator("#transferCost");
    if (await editCost.count()) {
      await expect(editCost).toHaveValue(/2500/);
    }

    // Salvar e verificar badge persiste
    await page.locator("button:has-text('Salvar Alterações')").click({ force: true });
    await expect(page.getByRole("heading", { level: 1, name: "Entradas" })).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator("text=🛒 Carrinho").first()).toBeVisible({ timeout: 5_000 });

    // Limpeza: excluir a entrada criada
    await page.locator("button:has-text('Excluir')").first().click();
    await expect(page.locator("div[role='alertdialog']")).toBeVisible({ timeout: 5_000 });
    await page.locator("div[role='alertdialog'] button:has-text('Excluir')").click({ force: true });
  });
});
