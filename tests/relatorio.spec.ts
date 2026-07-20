import { test, expect } from "@playwright/test";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./helpers";

const PASSWORD = "Test@123456";
const email = `rel_${Date.now()}@teste.com`;

test("filtros refletem nos resumos e tabelas", async ({ page }) => {
  test.setTimeout(120_000);

  // 1. Registrar
  await page.goto("/login");
  await page.waitForSelector("text=Cadastre-se", { timeout: 10_000 });
  await page.click("text=Cadastre-se");
  await page.waitForSelector("#name", { timeout: 5_000 });
  await page.fill("#name", "Teste Rel");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForFunction(() => location.pathname === "/", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  // 2. Seed dados completos (incluindo venda)
  await page.evaluate(async ({ url, anonKey }) => {
    const raw = localStorage.getItem(`sb-${url.replace("https://", "").split(".")[0]}-auth-token`);
    if (!raw) throw new Error("no session");
    const s = JSON.parse(raw);
    const uid = s.user.id;
    const h = (b: Record<string, unknown>) => ({
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ ...b, user_id: uid }),
    });

    const [oid, pid, aid, otId, cid] = Array.from({ length: 5 }, () => crypto.randomUUID());

    await fetch(`${url}/rest/v1/owners`, h({ id: oid, name: "Ana" }));
    await fetch(`${url}/rest/v1/programs`, h({ id: pid, name: "Azul", type: "milhas" }));
    await fetch(`${url}/rest/v1/origem_types`, h({ id: otId, name: "Compra", account_type: "pontos", color: "#10b981", description: '{"hasRecurrence":false}' }));
    await fetch(`${url}/rest/v1/accounts`, h({ id: aid, owner_id: oid, program_id: pid, name: "Conta Azul", type: "milhas", balance: 10000, total_invested: 300, average_cost_per_mile: 0.03, status: "ativa" }));
    await fetch(`${url}/rest/v1/entries`, h({ id: crypto.randomUUID(), account_id: aid, origem_type_id: otId, amount: 10000, amount_paid: 300, cost_per_thousand: 30, miles_generated: 10000, cost_per_mile: 0.03, date: new Date().toISOString().split("T")[0] }));
    await fetch(`${url}/rest/v1/clients`, h({ id: cid, name: "Carlos" }));
    await fetch(`${url}/rest/v1/sales`, h({ id: crypto.randomUUID(), account_id: aid, client_id: cid, miles_used: 5000, sale_value: 250, cost_per_mile: 0.03, profit: 100, program: "Azul", date: new Date().toISOString().split("T")[0], status: "pago" }));
  }, { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY });

  // 3. Ir para relatorios
  await page.goto("/relatorios");
  await page.waitForLoadState("networkidle");

  // 4. Summary cards — dados existem
  await expect(page.getByText("R$ 300").first()).toBeVisible({ timeout: 5_000 }); // invested

  // 5. Tabela Owner deve ter Ana
  await expect(page.getByText("Ana").first()).toBeVisible({ timeout: 3_000 });

  // 6. Tabela Program deve ter Azul
  await expect(page.getByText("Azul").first()).toBeVisible({ timeout: 3_000 });

  // 7. Filtrar por dono "Ana" — dados continuam (único dono)
  await page.getByText("Todos os Donos").click();
  await expect(page.getByRole("option", { name: "Ana" })).toBeVisible({ timeout: 3_000 });
  await page.getByRole("option", { name: "Ana" }).click();
  await expect(page.getByText("R$ 300").first()).toBeVisible({ timeout: 5_000 });

  // 8. Voltar para "Todos os Donos"
  await page.getByText("Ana").first().click();
  await expect(page.getByRole("option", { name: "Todos os Donos" })).toBeVisible({ timeout: 3_000 });
  await page.getByRole("option", { name: "Todos os Donos" }).click();
  await expect(page.getByText("R$ 300").first()).toBeVisible({ timeout: 5_000 });

  // 9. Período 7 dias — dados recentes, devem continuar
  await page.getByText("Últimos 30 dias").click();
  await expect(page.getByRole("option", { name: "Últimos 7 dias" })).toBeVisible({ timeout: 3_000 });
  await page.getByRole("option", { name: "Últimos 7 dias" }).click();
  await expect(page.getByText("R$ 300").first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("R$ 300").first()).toBeVisible({ timeout: 3_000 });
});