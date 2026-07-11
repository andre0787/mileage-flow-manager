import { test, expect } from "@playwright/test";

test("debug clube badge", async ({ page }) => {
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });
  await page.fill("#name", "Debug Clube");
  await page.fill("#email", `debug_${Date.now()}@teste.com`);
  await page.fill("#password", "Test@123456");
  await page.click("button[type='submit']");
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });

  const supabaseUrl = 'https://ohyplfpcwxzakujjfwdf.supabase.co';
  const supabaseAnonKey = 'sb_publishable_TpuJ6Mokci012dnOdyMfyA_F0e3dZVs';

  await page.evaluate(async ({ url, anonKey }) => {
    const sessionStr = localStorage.getItem('sb-ohyplfpcwxzakujjfwdf-auth-token');
    const session = JSON.parse(sessionStr!);
    const token = session.access_token;
    const userId = session.user.id;
    const headers = { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${token}` };
    const post = (table: string, body: Record<string, unknown>) =>
      fetch(`${url}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify({ ...body, user_id: userId }) });

    const ownerId = crypto.randomUUID();
    const programId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const otId = crypto.randomUUID();
    await post('owners', { id: ownerId, name: 'Dono Debug' });
    await post('programs', { id: programId, name: 'Programa Milhas', type: 'milhas' });
    await post('origem_types', { id: otId, name: 'Clube Fidelidade', account_type: 'milhas', color: '#f59e0b', description: JSON.stringify({ hasRecurrence: true }) });
    await post('accounts', { id: accountId, owner_id: ownerId, program_id: programId, name: 'Conta Milhas', type: 'milhas', balance: 0, total_invested: 0, average_cost_per_mile: 0, status: 'ativa' });
    return { ownerId, programId, accountId, otId };
  }, { url: supabaseUrl, anonKey: supabaseAnonKey });

  await page.goto("/entradas");
  await page.waitForSelector("text=Entradas", { timeout: 15_000 });
  await page.getByRole("tab", { name: /milhas/i }).click();
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Nova Entrada')").first().click();
  await page.waitForTimeout(500);

  // Debug: print all visible form elements
  const html = await page.evaluate(() => {
    const selects = document.querySelectorAll("[role=combobox]");
    return { selectCount: selects.length, selectTexts: Array.from(selects).map(s => s.textContent) };
  });
  console.log("SELECTORS:", JSON.stringify(html));

  // Select account
  const cmb = page.locator("[role=combobox]");
  await cmb.nth(0).click();
  await page.locator("text=Conta Milhas").click();
  await page.waitForTimeout(300);

  // Select origem type
  await cmb.nth(1).click();
  await page.locator("text=Clube Fidelidade").click();
  await page.waitForTimeout(500);

  // Check if clube section appeared
  const hasClubeSection = await page.locator("text=Recorrência ativada").isVisible().catch(() => false);
  console.log("HAS CLUBE SECTION:", hasClubeSection);

  const formHtml = await page.evaluate(() => document.querySelector("[role=dialog]")?.innerHTML?.substring(0, 2000));
  console.log("FORM HTML:", formHtml);

  await page.fill("#amount", "10000");
  await page.fill("#amountPaid", "350.00");
  await page.fill("input[placeholder='Ex: 12']", "3");

  await page.locator("button:has-text('Registrar Entrada')").click();
  await page.waitForTimeout(3000);

  // Check table content
  const tableHtml = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));
  console.log("TABLE HTML:", tableHtml);
});
